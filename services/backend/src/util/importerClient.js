const axios = require('axios')

const { importerToken, importerUrl } = require('../conf-backend')

const importerClient = axios.create({
  headers: {
    token: importerToken,
  },
  baseURL: importerUrl,
})

const getImporterClient = () => {
  console.log('importerToken', importerToken)
  console.log('importerUrl', importerUrl)
  if (!importerToken || !importerUrl) {
    console.log("Importer token or importer url not set, can't return client!")
    return null
  }
  return importerClient
}

module.exports = {
  getImporterClient,
}
