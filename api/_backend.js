// Reads the current bot address (tunnel) from Edge Config and forwards validated requests to it.
const hits = new Map() // best-effort per-instance limiter (the bot has its own authoritative limits)
let cachedBackend = { url: '', at: 0 }
const CACHE_TTL_MS = 15 * 1000

async function fetchBackendUrl() {
  const conn = process.env.EDGE_CONFIG
  if (!conn) throw new Error('EDGE_CONFIG missing')
  const u = new URL(conn)
  const id = u.pathname.replace(/^\//, '')
  const token = u.searchParams.get('token')
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://edge-config.vercel.com/${id}/item/backend?version=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) throw new Error(`no backend yet (${r.status})`)
      const b = new URL(String(await r.json()))
      if (!/^https?:$/.test(b.protocol)) throw new Error('bad backend protocol')
      const clean = b.origin + b.pathname.replace(/\/$/, '')
      cachedBackend = { url: clean, at: Date.now() }
      return clean
    } catch (e) {
      lastErr = e
      if (attempt === 0) await new Promise((r) => setTimeout(r, 300))
    }
  }
  throw lastErr || new Error('no backend yet')
}

async function getBackend(forceFresh = false) {
  if (!forceFresh && cachedBackend.url && Date.now() - cachedBackend.at < CACHE_TTL_MS) {
    return cachedBackend.url
  }
  return fetchBackendUrl()
}

const isNumber = (v) => /^\d{8,15}$/.test(String(v || ''))
const isVisitorId = (v) => /^[a-z0-9]{8,64}$/i.test(String(v || ''))
const cleanNumber = (v) => String(v || '').replace(/\D/g, '').slice(0, 15)

function clientIp(req) {
  const raw = String(req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim()
  return /^[0-9a-fA-F:.]{3,45}$/.test(raw) ? raw : ''
}

function secure(res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
}

// Blocks cross-site browser calls (CSRF-style abuse of the POST endpoints).
function sameOrigin(req) {
  const site = req.headers['sec-fetch-site']
  if (site && !['same-origin', 'none'].includes(site)) return false
  const origin = req.headers.origin
  if (origin) {
    try {
      const originHost = new URL(origin).host
      const hosts = [req.headers.host, req.headers['x-forwarded-host']]
        .filter(Boolean)
        .flatMap((h) => String(h).split(',').map((s) => s.trim()))
      return hosts.includes(originHost)
    } catch {
      return false
    }
  }
  return true
}

function limited(req, key, max, windowMs) {
  const k = key + ':' + (clientIp(req) || 'anon')
  const now = Date.now()
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    hits.set(k, arr)
    return true
  }
  arr.push(now)
  hits.set(k, arr)
  if (hits.size > 5000) for (const [kk, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(kk)
  return false
}

function isTransientResponse(status, data) {
  return data === null || (status >= 502 && status <= 504) || (status >= 520 && status <= 526)
}

async function fetchUpstream(req, url, init = {}, timeoutMs = 10000) {
  const headers = { 'x-forwarded-for': clientIp(req) }
  if (process.env.API_SECRET) headers['x-api-secret'] = process.env.API_SECRET
  const r = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'error',
  })
  const text = (await r.text()).slice(0, 65536)
  let data = null
  try { data = JSON.parse(text) } catch { data = null }
  return { status: r.status, data }
}

async function forward(req, res, url, init = {}, timeoutMs = 10000) {
  const { status, data } = await fetchUpstream(req, url, init, timeoutMs)
  secure(res)
  if (data === null) return res.status(502).json({ ok: false, error: 'تعذر الاتصال بسيرفر البوت، حاول مرة أخرى' })
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(data))
}

async function forwardToBackend(req, res, path, init = {}, opts = {}) {
  const timeoutMs = opts.timeoutMs || 10000
  const retries = Number.isInteger(opts.retries) ? opts.retries : 1
  const resolveBackend = opts.getBackend || getBackend
  const doFetch = opts.fetchUpstream || fetchUpstream
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const base = await resolveBackend(attempt > 0)
      const { status, data } = await doFetch(req, `${base}${path}`, init, timeoutMs)
      if (!isTransientResponse(status, data) || attempt === retries) {
        secure(res)
        if (data === null) {
          return res.status(502).json({ ok: false, error: 'تعذر الاتصال بسيرفر البوت، حاول مرة أخرى' })
        }
        return res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(data))
      }
    } catch (e) {
      if (attempt === retries) throw e
    }
    await new Promise((r) => setTimeout(r, opts.retryDelayMs ?? 700))
  }
}

module.exports = {
  getBackend,
  forward,
  forwardToBackend,
  isTransientResponse,
  isNumber,
  isVisitorId,
  cleanNumber,
  secure,
  sameOrigin,
  limited,
  clientIp,
}
