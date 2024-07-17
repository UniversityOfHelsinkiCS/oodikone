import axios from 'axios'

import { importerUrl, importerToken } from '../conf-backend'
import logger from './logger'

const importerClient = axios.create({
  headers: {
    token: importerToken,
  },
  baseURL: importerUrl,
})

export const getImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return importerClient
}
