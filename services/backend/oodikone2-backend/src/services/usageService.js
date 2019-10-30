const axios = require('axios')
const { USAGESERVICE_URL } = require('../conf-backend')

/** @type {axios.AxiosInstance} */
const client = axios.create({ baseURL: USAGESERVICE_URL, headers: { secret: process.env.USAGESERVICE_SECRET } })

const ping = async () => {
  const url = '/ping'
  await client.get(url)
}

const log = async (message, meta) => {
  await client.post('/log', { message, meta })
}

/** @returns {Promise<stream.Readable>} */
const getStream = async (from, to) => {
  const res = await client.get('/log', { params: { from, to }, responseType: 'stream' })
  return res.data
}

module.exports = {
  ping,
  log,
  getStream
}
