const { forwardToBackend, secure, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'GET') return res.status(405).json({ ok: false })
  if (limited(req, 'stats', 60, 60 * 1000)) return res.status(429).json({ ok: false })
  try {
    await forwardToBackend(req, res, '/api/stats', {}, { timeoutMs: 10000, retries: 1 })
  } catch (e) {
    res.status(503).json({ ok: false })
  }
}
