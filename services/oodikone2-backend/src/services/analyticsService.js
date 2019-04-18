const axios = require('axios')
const { ANALYTICS_URL } = require('../conf-backend')

const client = axios.create({ baseURL: ANALYTICS_URL })

const ping = async () => {
  const response = await client.get('/ping')
  return response.data
}

const getProductivity = async (id) => {
  const response = await client.get(`/productivity/${id}`)
  return response.data
}

const setProductivity = async (data) => {
  const response = await client.post('/productivity', { data })
  return response.data
}

const getThroughput = async (id) => {
  const response = await client.get(`/throughput/${id}`)
  return response.data
}

const setThroughput = async (data) => {
  const response = await client.post('/throughput', { data })
  return response.data
}

module.exports = {
  ping,
  getProductivity,
  setProductivity,
  getThroughput,
  setThroughput
}