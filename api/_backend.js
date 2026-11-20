// Reads the current bot address (tunnel) from Edge Config and forwards validated requests to it.
const hits = new Map() // best-effort per-instance limiter (the bot has its own authoritative limits)

async function getBackend() {
  const conn = process.env.EDGE_CONFIG
  if (!conn) throw new Error('EDGE_CONFIG missing')
  const u = new URL(conn)
  const id = u.pathname.replace(/^\//, '')
  const token = u.searchParams.get('token')
  const r = await fetch(`https://edge-config.vercel.com/${id}/item/backend?version=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })
  if (!r.ok) throw new Error('no backend yet')
  const b = new URL(String(await r.json()))
  if (!/^https?:$/.test(b.protocol)) throw new Error('bad backend protocol')
  return b.origin + b.pathname.replace(/\/$/, '')
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
  if (origin) { try { return new URL(origin).host === req.headers.host } catch { return false } }
  return true
}

function limited(req, key, max, windowMs) {
  const k = key + ':' + (clientIp(req) || 'anon')
  const now = Date.now()
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs)
  arr.push(now)
  hits.set(k, arr)
  if (hits.size > 5000) for (const [kk, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(kk)
  return arr.length > max
}

async function forward(req, res, url, init = {}, timeoutMs = 10000) {
  const headers = { 'x-forwarded-for': clientIp(req) }
  if (process.env.API_SECRET) headers['x-api-secret'] = process.env.API_SECRET
  const r = await fetch(url, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' })
  const text = (await r.text()).slice(0, 65536)
  let data
  try { data = JSON.parse(text) } catch { data = null }
  secure(res)
  if (data === null) return res.status(502).json({ ok: false })
  res.status(r.status).setHeader('Content-Type', 'application/json').send(JSON.stringify(data))
}

module.exports = { getBackend, forward, isNumber, isVisitorId, cleanNumber, secure, sameOrigin, limited, clientIp }
