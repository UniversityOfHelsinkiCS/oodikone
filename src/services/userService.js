const axios = require('axios')

const ping = async () => {
  const url = `${process.env.USERSERVICE_URL}/ping`
  const response = await axios.get(url)
  return response.data
}

module.exports = {
  ping
}