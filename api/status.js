const { getBackend, forward } = require('./_backend')

module.exports = async (req, res) => {
  try {
    const number = String(req.query.number || '').replace(/\D/g, '')
    const base = await getBackend()
    await forward(req, res, `${base}/api/status/${number}`)
  } catch (e) {
    res.status(503).json({ connected: false })
  }
}
