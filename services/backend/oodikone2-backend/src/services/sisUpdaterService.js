const axios = require('axios')
const { SIS_UPDATER_URL, SECRET_TOKEN } = require('../conf-backend')

const client = axios.create({ baseURL: SIS_UPDATER_URL })

const updateSISStudents = async () => {
  const response = await client.get('/v1/students', { params: { token: SECRET_TOKEN } })
  return response.data
}

const updateSISMetadata = async () => {
  const response = await client.get('/v1/meta', { params: { token: SECRET_TOKEN } })
  return response.data
}

module.exports = {
  updateSISMetadata,
  updateSISStudents
}
