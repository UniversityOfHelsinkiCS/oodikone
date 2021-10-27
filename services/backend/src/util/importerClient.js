const axios = require('axios')
const { importerToken } = require('../conf-backend')
const logger = require('./logger')

const importerClient = axios.create({
  headers: {
    token: importerToken,
  },
  baseURL: 'https://importer.cs.helsinki.fi',
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
