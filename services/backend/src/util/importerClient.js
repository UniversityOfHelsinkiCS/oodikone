const axios = require('axios')
const { importerUrl, importerToken } = require('../conf-backend')
const logger = require('./logger')

const importerClient = axios.create({
  headers: {
    token: importerToken,
  },
  baseURL: importerUrl,
})

const getImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return importerClient
}

module.exports = {
  getImporterClient,
}
