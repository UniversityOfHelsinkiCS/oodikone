import axios from 'axios'

import { importerUrl, importerToken, serviceProvider, importerDbApiUser, importerDbApiPassword } from '../config'
import logger from './logger'

const createEnvAuthHeader = () : { Authorization : string } | { token : string } => {
  if (serviceProvider === 'toska') {
    return createTokenHeader()
  } else {
    return createBasicAuthHeader()
  }
}

const createTokenHeader = ()  => { 
  return { token: importerToken }
}

const createBasicAuthHeader = () => {
  const auth = `${importerDbApiUser}:${importerDbApiPassword}`
  const token = Buffer.from(auth).toString('base64')
  return {
    Authorization: 'Basic ' + token
  }
}

const toskaImporterClient = axios.create({
  headers: createTokenHeader(),
  baseURL: importerUrl,
})

const fdImporterClient = axios.create({
  headers: createBasicAuthHeader(),
  baseURL: importerUrl,
})

const missingBasicAuthCredentials = (!importerDbApiUser || !importerDbApiPassword)

const getFdImporterClient = () => {
  if (missingBasicAuthCredentials) {
    logger.error("Basic auth credentials not set, can't return client!")
    return null
  }
  return toskaImporterClient
}

const getToskaImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return fdImporterClient
}

export const getImporterClient = serviceProvider === 'toska' ? getToskaImporterClient : getFdImporterClient
