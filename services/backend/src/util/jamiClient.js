const axios = require('axios')
const { importerToken, jamiUrl } = require('../conf-backend')
const logger = require('./logger')

const jamiClient = axios.create({
  params: {
    token: importerToken,
  },
  baseURL: jamiUrl,
})

const getJamiClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return jamiClient
}

module.exports = {
  getJamiClient,
}
