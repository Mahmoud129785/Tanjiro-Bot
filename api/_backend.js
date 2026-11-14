// يقرأ عنوان البوت الحالي (النفق) من Edge Config
async function getBackend() {
  const conn = process.env.EDGE_CONFIG
  if (!conn) throw new Error('EDGE_CONFIG غير مضبوط')
  const u = new URL(conn)
  const id = u.pathname.replace(/^\//, '')
  const token = u.searchParams.get('token')
  const r = await fetch(`https://edge-config.vercel.com/${id}/item/backend?version=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error('لا يوجد عنوان للبوت بعد')
  return String(await r.json()).replace(/\/$/, '')
}

async function forward(req, res, url, init = {}) {
  const headers = { 'x-forwarded-for': req.headers['x-forwarded-for'] || '' }
  if (process.env.API_SECRET) headers['x-api-secret'] = process.env.API_SECRET
  const r = await fetch(url, { ...init, headers: { ...headers, ...(init.headers || {}) } })
  const text = await r.text()
  res.status(r.status).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').send(text)
}

module.exports = { getBackend, forward }
