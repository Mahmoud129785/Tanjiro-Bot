const { getBackend, forward, isNumber, cleanNumber, secure, sameOrigin, limited } = require('./_backend')

// Expects the bot to answer { ok: true, qr: "data:image/png;base64,..." } on POST /api/qr.
module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden' })
  if (limited(req, 'qr-cd', 1, 45 * 1000)) return res.status(429).json({ ok: false, error: 'انتظر 45 ثانية قبل الطلب التالي' })
  const number = cleanNumber(req.body && req.body.number)
  if (!isNumber(number)) return res.status(400).json({ ok: false, error: 'أدخل رقماً صحيحاً' })
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    }, 45000)
  } catch (e) {
    res.status(503).json({ ok: false, error: 'رمز QR غير متاح حالياً' })
  }
}
