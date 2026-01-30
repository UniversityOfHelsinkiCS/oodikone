import axios from 'axios'

import { importerToken, importerUrl } from '../config'
import logger from './logger'

const toskaImporterClient = axios.create({
  headers: { token: importerToken },
  baseURL: importerUrl,
  timeout: 10000,
})

const getToskaImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return toskaImporterClient
}

export const getImporterClient = getToskaImporterClient
