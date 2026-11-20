const { forwardToBackend, isNumber, cleanNumber, secure, limited } = require('./_backend')

module.exports = async (req, res) => {
  secure(res)
  if (req.method !== 'GET') return res.status(405).json({ connected: false })
  if (limited(req, 'status', 90, 60 * 1000)) return res.status(429).json({ connected: false })
  const number = cleanNumber(req.query && req.query.number)
  if (!isNumber(number)) return res.status(400).json({ connected: false })
  try {
    await forwardToBackend(req, res, `/api/status/${number}`, {}, { timeoutMs: 10000, retries: 1 })
  } catch (e) {
    res.status(503).json({ connected: false })
  }
}
