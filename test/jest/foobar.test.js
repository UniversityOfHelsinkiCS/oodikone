const nock = require('nock')
const axios = require('axios')
const httpAdapter = require('axios/lib/adapters/http')

const baseUrl = 'http://localhost'

axios.defaults.adapter = httpAdapter

nock(baseUrl)
  .get('/ping')
  .reply(200, 'pong')

test('foo equals foo', () => {
  expect('foo').toBe('foo')
})

test('ping returns pong', async () => {
  const response = await axios.get(`${baseUrl}/ping`)
  expect(response.data).toBe('pong')
})