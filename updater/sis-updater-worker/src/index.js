const { dbConnections } = require('./db/connection')
const { logger } = require('./utils/logger')
const { stan } = require('./utils/stan')
require('./worker')

stan.on('error', error => {
  logger.error({ message: 'NATS connection failed', meta: error })
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  logger.info(`Connected to NATS as ${clientID}`)
  dbConnections.connect()
})

dbConnections.on('error', () => {
  logger.error('DB connections failed')
  if (!process.env.CI) process.exit(1)
})

dbConnections.on('connect', async () => {
  logger.info('DB connections established')
})
