const axios = require('axios')
const { ANALYTICS_URL } = require('../conf-backend')

const client = axios.create({ baseURL: ANALYTICS_URL })

const ping = async () => {
  const response = await client.get('/ping')
  return response.data
}

const getProductivity = async (id) => {
  const response = await client.get(`/data/${id}`)
  return response.data
}

const setProductivity = async (data) => {
  const response = await client.post('/data', { data })
  return response.data
}

module.exports = {
  ping,
  getProductivity,
  setProductivity
}