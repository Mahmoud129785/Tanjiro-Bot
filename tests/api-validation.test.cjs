const test = require('node:test')
const assert = require('node:assert')
const { isNumber, isVisitorId, cleanNumber, sameOrigin } = require('../api/_backend')

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
test('cross-site browser requests are rejected', () => {
  assert.equal(sameOrigin({ headers: { 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(sameOrigin({ headers: { origin: 'https://evil.com', host: 'site.com' } }), false)
  assert.equal(sameOrigin({ headers: { origin: 'https://site.com', host: 'site.com' } }), true)
})
