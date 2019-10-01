const axios = require('axios')
const { USAGESERVICE_URL } = require('../conf-backend')

const client = axios.create({ baseURL: USAGESERVICE_URL, headers: { secret: process.env.USAGESERVICE_SECRET } })

const ping = async () => {
  const url = '/ping'
  await client.get(url)
}

const log = async (message, meta) => {
  await client.post('/log', { message, meta })
}

const get = async (from, to) => {
  const response = await client.get('/log', { params: { from, to } })
  return response.data
}

module.exports = {
  ping,
  log,
  get
}
