const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { isNumber, isVisitorId, cleanNumber, sameOrigin, forwardToBackend } = require('../api/_backend')

test('phone numbers: digits only, 8 to 15', () => {
  assert.equal(isNumber('96890000412'), true)
  assert.equal(isNumber('1234567'), false)
  assert.equal(isNumber('1234567890123456'), false)
  assert.equal(isNumber('../etc/passwd'), false)
  assert.equal(cleanNumber('+968 9000-0412'), '96890000412')
})
test('visitor ids are alphanumeric', () => {
  assert.equal(isVisitorId('abc123def456'), true)
  assert.equal(isVisitorId('a b'), false)
  assert.equal(isVisitorId('<script>alert(1)</script>'), false)
})
test('cross-site browser requests are rejected, forwarded host accepted', () => {
  assert.equal(sameOrigin({ headers: { 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(sameOrigin({ headers: { origin: 'https://evil.com', host: 'site.com' } }), false)
  assert.equal(sameOrigin({ headers: { origin: 'https://site.com', host: 'site.com' } }), true)
  assert.equal(sameOrigin({ headers: { origin: 'https://custom.com', host: 'internal.vercel.app', 'x-forwarded-host': 'custom.com' } }), true)
})
test('forwardToBackend retries once on transient non-JSON 502 and returns pairing code', async () => {
  let calls = 0
  let freshFlags = []
  let outStatus = 0
  let outBody = ''
  const res = {
    setHeader() { return this },
    status(s) { outStatus = s; return this },
    json(obj) { outBody = JSON.stringify(obj); return this },
    send(txt) { outBody = txt; return this },
  }
  await forwardToBackend({ headers: {} }, res, '/api/pair', { method: 'POST' }, {
    retries: 1,
    retryDelayMs: 1,
    getBackend: async (fresh) => { freshFlags.push(fresh); return 'https://example.test' },
    fetchUpstream: async () => {
      calls++
      if (calls === 1) return { status: 502, data: null }
      return { status: 200, data: { ok: true, code: 'ABCD-1234' } }
    },
  })
  assert.equal(calls, 2)
  assert.deepEqual(freshFlags, [false, true])
  assert.equal(outStatus, 200)
  assert.deepEqual(JSON.parse(outBody), { ok: true, code: 'ABCD-1234' })
})
test('QR endpoint and tutorial video files are removed', () => {
  const root = path.join(__dirname, '..')
  assert.equal(fs.existsSync(path.join(root, 'api/qr.js')), false)
  assert.equal(fs.existsSync(path.join(root, 'public/guide.js')), false)
  assert.equal(fs.existsSync(path.join(root, 'public/media/copy-and-link-tanjiro.mp4')), false)
  assert.equal(fs.existsSync(path.join(root, 'public/media/tutorial-poster.jpg')), false)
  const appJs = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8')
  assert.equal(appJs.includes('/api/qr'), false)
  assert.equal(appJs.includes('createGuideSection'), false)
})
