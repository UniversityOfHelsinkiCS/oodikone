const axios = require('axios')
const { UPDATER_URL } = require('../conf-backend')

const client = axios.create({ baseURL: UPDATER_URL })

const ping = async () => {
  const url = '/ping'
  const response = await axios.get(url)
  return response.data
}

const updateStudents = async (studentNumbers) => {
  const response = await client.post('/update', studentNumbers)
  return response.data
}

const updateOldestStudents = async (amount) => {
  const response = await client.post('/update/oldest', { amount })
  return response.data
}

const updateAllStudents = async () => {
  const response = await client.post('/update/all')
  return response.data
}

const updateActiveStudents = async () => {
  const response = await client.post('/update/active')
  return response.data
}

const updateNoStudents = async () => {
  const response = await client.post('/update/no_student')
  return response.data
}

const updateMetadata = async () => {
  const response = await client.post('/update/meta')
  return response.data
}

const updateAttainments = async () => {
  const response = await client.post('/update/attainment')
  return response.data
}

const updateStudentlist = async () => {
  const response = await client.post('/update/studentlist')
  return response.data
}

const getStatuses = async () => {
  const response = await client.get('/statuses')
  return response.data
}

const rescheduleScheduled = async () => {
  const response = await client.post('/reschedule/scheduled')
  return response.data
}

const rescheduleFetched = async () => {
  const response = await client.post('/reschedule/fetched')
  return response.data
}

module.exports = {
  ping,
  updateStudents,
  updateOldestStudents,
  updateAllStudents,
  updateActiveStudents,
  updateMetadata,
  updateAttainments,
  updateStudentlist,
  getStatuses,
  rescheduleScheduled,
  rescheduleFetched,
  updateNoStudents
}