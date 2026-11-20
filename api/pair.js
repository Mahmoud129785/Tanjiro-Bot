const { getBackend, forward, isNumber, cleanNumber, secure, sameOrigin, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden' })
  if (limited(req, 'pair-cd', 1, 45 * 1000)) return res.status(429).json({ ok: false, error: 'انتظر 45 ثانية قبل الطلب التالي' })
  if (limited(req, 'pair', 8, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'طلبات كثيرة، حاول لاحقاً' })
  const number = cleanNumber(req.body && req.body.number)
  if (!isNumber(number)) return res.status(400).json({ ok: false, error: 'أدخل رقماً صحيحاً' })
  try {
    const base = await getBackend()
    await forward(req, res, `${base}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    }, 45000)
  } catch (e) {
    res.status(503).json({ ok: false, error: 'البوت غير متاح حالياً، حاول بعد دقيقة' })
  }
}
