const { forwardToBackend, isNumber, cleanNumber, secure, sameOrigin, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden' })
  const number = cleanNumber(req.body && req.body.number)
  if (!isNumber(number)) return res.status(400).json({ ok: false, error: 'أدخل رقماً صحيحاً' })
  if (limited(req, 'pair', 15, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'طلبات كثيرة، حاول لاحقاً' })
  try {
    await forwardToBackend(req, res, '/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    }, { timeoutMs: 25000, retries: 1 })
  } catch (e) {
    res.status(503).json({ ok: false, error: 'البوت غير متاح حالياً، حاول بعد دقيقة' })
  }
}
