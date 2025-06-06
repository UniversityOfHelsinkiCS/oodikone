import { dbConnections } from './db/connection.js'
import logger from './utils/logger.js'
import './worker.js'

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
