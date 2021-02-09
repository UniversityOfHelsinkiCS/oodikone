const axios = require('axios')
const { SIS_UPDATER_URL, SECRET_TOKEN } = require('../conf-backend')

const client = axios.create({ baseURL: SIS_UPDATER_URL })

const updateSISStudents = async () => {
  const response = await client.get('/v1/students', { params: { token: SECRET_TOKEN } })
  return response.data
}

const updateStudentsByStudentNumber = async studentnumbers => {
  const data = { studentnumbers }
  const acual_data = data.map(n => (n[0] === '0' ? n : `+${n}`))

  console.log(acual_data)

  const response = await client.post('/v1/students', acual_data, { params: { token: SECRET_TOKEN } })
  return response.data
}

const updateSISMetadata = async () => {
  const response = await client.get('/v1/meta', { params: { token: SECRET_TOKEN } })
  return response.data
}

const updateSISProgrammes = async () => {
  const response = await client.get('/v1/programmes', { params: { token: SECRET_TOKEN } })
  return response.data
}

const abort = async () => {
  const response = await client.get('/v1/abort', { params: { token: SECRET_TOKEN } })
  return response.data
}

module.exports = {
  updateSISMetadata,
  updateSISStudents,
  updateSISProgrammes,
  updateStudentsByStudentNumber,
  abort
}
