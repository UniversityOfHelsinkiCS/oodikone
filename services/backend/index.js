require('./src/util/sentry') // Sentry must be the first import
require('./src/app')
const logger = require('./src/util/logger')

process.on('unhandledRejection', reason => {
  logger.error({ message: 'unhandledRejection: ', meta: reason })
})

process.on('SIGTERM', () => process.exit())
process.on('SIGINT', () => process.exit())
