const { forwardToBackend, isVisitorId, secure, sameOrigin, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  if (!sameOrigin(req)) return res.status(403).json({ ok: false })
  if (limited(req, 'ping', 20, 60 * 1000)) return res.status(429).json({ ok: false })
  const id = String((req.body && req.body.id) || '')
  if (!isVisitorId(id)) return res.status(400).json({ ok: false })
  try {
    await forwardToBackend(req, res, '/api/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }, { timeoutMs: 10000, retries: 1 })
  } catch (e) {
    res.status(503).json({ ok: false })
  }
}
