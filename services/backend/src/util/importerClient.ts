import { Fetchios } from '@oodikone/shared/util/fetchios'
import { importerToken, importerUrl } from '../config'
import logger from './logger'

const importerClient = Fetchios.create({
  headers: { token: importerToken },
  baseUrl: importerUrl,
  timeout: 10000,
})

export const getImporterClient = () => {
  if (!importerToken) {
    logger.error("Importer token not set, can't return client!")
    return null
  }
  return importerClient
}
