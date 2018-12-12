const axios = require('axios')

const ping = async () => {
  const url = `${process.env.USERSERVICE_URL}/ping`
  const response = await axios.get(url)
  return response.data
}

const byUsername = async (uid) => {
  const url = `${process.env.USERSERVICE_URL}/user/${uid}`
  const response = await axios.get(url)
  return response.data
}

const updateUser = async (uid, fields) => {
  const url = `${process.env.USERSERVICE_URL}/user/${uid}`
  const response = await axios.put(url, fields )
  return response.data
}

const createUser = async (username, full_name, email) => {
  const url = `${process.env.USERSERVICE_URL}/user`

  const response = await axios.post(url, {
    username, full_name, email
  })

  return response.data
}

module.exports = {
  ping, byUsername, createUser, updateUser
}