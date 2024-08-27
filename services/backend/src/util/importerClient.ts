import axios from 'axios'

import { importerDbApiPassword, importerDbApiUser, importerToken, importerUrl, serviceProvider } from '../config'
import logger from './logger'

const createBasicAuthHeader = () => {
  const auth = `${importerDbApiUser}:${importerDbApiPassword}`
  const token = Buffer.from(auth).toString('base64')
  return {
    Authorization: `Basic ${token}`,
  }
}

const toskaImporterClient = axios.create({
  headers: { token: importerToken },
  baseURL: importerUrl,
})

const fdImporterClient = axios.create({
  headers: createBasicAuthHeader(),
  baseURL: importerUrl,
})

const missingBasicAuthCredentials = !importerDbApiUser || !importerDbApiPassword

const getFdImporterClient = () => {
  if (missingBasicAuthCredentials) {
    logger.error("Basic auth credentials not set, can't return client!")
    return null
  }
  return fdImporterClient
}

const getToskaImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return toskaImporterClient
}

export const getImporterClient = serviceProvider === 'toska' ? getToskaImporterClient : getFdImporterClient
