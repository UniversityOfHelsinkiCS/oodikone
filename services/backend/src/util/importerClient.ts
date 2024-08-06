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

const importerClient = axios.create({
  headers: createEnvAuthHeader(),
  baseURL: importerUrl,
})

const missingBasicAuthCredentials = (!importerDbApiUser || !importerDbApiPassword)

/*export const getImporterClient = () => {
  if (serviceProvider === 'toska' && !importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  else if (serviceProvider === 'fd' && missingBasicAuthCredentials) {
    logger.error("Basic auth credentials not set, can't return client!")
    return null
  }
  return importerClient
}*/

export const getImporterClient = () => {
  if (serviceProvider === 'toska' && !importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return importerClient
}
