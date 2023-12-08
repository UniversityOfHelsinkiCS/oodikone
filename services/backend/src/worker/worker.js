const { Worker } = require('bullmq')
const { redis } = require('../conf-backend')
const logger = require('../util/logger')

const connection = {
  host: redis,
  port: 6379,
}

// https://github.com/taskforcesh/bullmq/issues/2075#issuecomment-1646079335
process.execArgv = process.execArgv.filter(arg => !arg.includes('--max_old_space_size='))

const worker = new Worker('refresh-redis-data', `${__dirname}/processor.js`, {
  connection,
  useWorkerThreads: true,
  concurrency: 3,
})

worker.on('completed', job => {
  logger.info(`Completed job: ${job.id}`)
})

// If there is no error event listener, the worker stops taking jobs after any error.
worker.on('error', err => {
  logger.error(`Job returned error:`)
  logger.error(err.toString())
})

worker.on('failed', job => {
  const reason = job?.failedReason ?? ''
  const id = job?.id ?? ''
  logger.error(`Job ${id} failed.${reason}`)
})

worker.on('active', job => {
  logger.info(`Started job: ${job.id}`)
})
