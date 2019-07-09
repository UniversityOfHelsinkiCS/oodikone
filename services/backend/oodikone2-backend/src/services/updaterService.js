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


module.exports = {
  ping,
  updateStudents
}