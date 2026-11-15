const { getBackend, forward } = require('./_backend')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(req.body?.id || '') }),
    })
  } catch (e) {
    res.status(503).json({ ok: false })
  }
}
