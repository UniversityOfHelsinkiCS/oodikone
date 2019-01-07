const axios = require('axios')
const { USERSERVICE_URL } = require('../conf-backend')

const client = axios.create({ baseURL: USERSERVICE_URL })

const ping = async () => {
  const url = '/ping'
  const response = await axios.get(url)
  return response.data
}

const byUsername = async (uid) => {
  const url = `/user/${uid}`
  const response = await client.get(url)
  return response.data
}

const getUserElementdetails = async (username) => {
  const url = `/user/elementdetails/${username}`
  const response = await client.get(url)
  return response.data
}

const byId = async (id) => {
  const url = `/user/id/${id}`
  const response = await client.get(url)
  return response.data
}

const updateUser = async (uid, fields) => {
  const url = `/user/${uid}`
  const response = await client.put(url, fields)
  return response.data
}

const createUser = async (username, full_name, email) => {
  const response = await client.post('/user', {
    username, full_name, email
  })
  return response.data
}

module.exports = {
  ping, byUsername, createUser, updateUser, byId, getUserElementdetails
}