const axios = require('axios')
const { ANALYTICS_URL } = require('../conf-backend')

const client = axios.create({ baseURL: ANALYTICS_URL })

const ping = async () => {
  const response = await client.get('/ping')
  return response.data
}

const getProductivity = async id => {
  const response = await client.get(`/v2/productivity/${id}`)
  return response.data
}

const setProductivity = async data => {
  const response = await client.post('/v2/productivity', { data })
  return response.data
}

const patchProductivity = async data => {
  const response = await client.patch('/v2/productivity', { data })
  return response.data
}

const getThroughput = async id => {
  const response = await client.get(`/v2/throughput/${id}`)
  return response.data
}

const setThroughput = async data => {
  const response = await client.post('/v2/throughput', { data })
  return response.data
}

const patchThroughput = async data => {
  const response = await client.patch('/v2/throughput', { data })
  return response.data
}

const patchFacultyYearlyStats = async data => {
  const response = await client.patch('/facultystats', { data })
  return response.data
}

const getFacultyYearlyStats = async data => {
  const response = await client.get('/facultystats', { data })
  return response.data
}

const patchNonGraduatedStudents = async data => {
  const response = await client.patch('/v2/nongraduatedstudents', { data })
  return response.data
}

const getNonGraduatedStudents = async id => {
  const response = await client.get(`/v2/nongraduatedstudents/${id}`)
  return response.data
}

module.exports = {
  ping,
  getProductivity,
  setProductivity,
  patchProductivity,
  getThroughput,
  setThroughput,
  patchThroughput,
  patchFacultyYearlyStats,
  getFacultyYearlyStats,
  patchNonGraduatedStudents,
  getNonGraduatedStudents
}
