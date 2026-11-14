const { getBackend, forward } = require('./_backend')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: String(req.body?.number || '') }),
    })
  } catch (e) {
    res.status(503).json({ ok: false, error: 'البوت غير متاح حالياً، حاول بعد دقيقة' })
  }
}
