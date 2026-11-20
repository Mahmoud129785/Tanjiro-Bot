const { getBackend, forward, secure, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'GET') return res.status(405).json({ ok: false })
  if (limited(req, 'stats', 60, 60 * 1000)) return res.status(429).json({ ok: false })
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/stats`)
  } catch (e) {
    res.status(503).json({ ok: false })
  }
}
