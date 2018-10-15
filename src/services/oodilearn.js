const axios = require('axios')
const https = require('https')
const { OODILEARN_URL } = require('../conf-backend')

const instance = axios.create({
  baseUrl: OODILEARN_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
})

const ping = () => instance.get('/ping')

module.exports = {
  ping
}