const { dbConnections } = require('./db/connection')
const { logger } = require('./utils/logger')
require('./worker')

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
