const axios = require('axios')

const client = axios.create({ baseURL: '' }) // NOT USED ANYMORE MUAHAHAHA, delete when deleting other oodi-related functions and modules

const ping = async () => {
  const response = await client.get('/ping')
  return response.data
}

const getProductivity = async id => {
  const response = await client.get(`/productivity/${id}`)
  return response.data
}

const setProductivity = async data => {
  const response = await client.post('/productivity', { data })
  return response.data
}

const patchProductivity = async data => {
  const response = await client.patch('/productivity', { data })
  return response.data
}

const getThroughput = async id => {
  const response = await client.get(`/throughput/${id}`)
  return response.data
}

const setThroughput = async data => {
  const response = await client.post('/throughput', { data })
  return response.data
}

const patchThroughput = async data => {
  const response = await client.patch('/throughput', { data })
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
  const response = await client.patch('/nongraduatedstudents', { data })
  return response.data
}

const getNonGraduatedStudents = async id => {
  const response = await client.get(`/nongraduatedstudents/${id}`)
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
  getNonGraduatedStudents,
}
