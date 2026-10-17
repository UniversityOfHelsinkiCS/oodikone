import { dbConnections } from './db/connection'
import logger from './utils/logger'
import './worker'

dbConnections
  .connect()
  .then(() => {
    logger.info('DB connection established')
  })
  .catch(error => {
    logger.error('DB connection failed', { error })
  })

dbConnections.on('error', () => {
  logger.error('DB connections failed')
  process.exit(1)
})
