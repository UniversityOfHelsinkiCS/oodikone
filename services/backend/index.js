require('./src/app')
const logger = require('./src/util/logger')

process.on('unhandledRejection', reason => {
  logger.error({ message: 'unhandledRejection: ', meta: reason })
})
