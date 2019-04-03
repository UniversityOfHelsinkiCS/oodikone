const axios = require('axios')
const { USAGESERVICE_URL } = require('../conf-backend')

const client = axios.create({ baseURL: USAGESERVICE_URL })

const ping = async () => {
  const url = '/ping'
  client.get(url)
}

const log = async (message, meta) => {
  client.post('/log', { message, meta })
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