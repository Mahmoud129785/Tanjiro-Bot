const { getBackend, forward } = require('./_backend')

module.exports = async (req, res) => {
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/stats`)
  } catch (e) {
    res.status(503).json({ ok: false })
  }
}
