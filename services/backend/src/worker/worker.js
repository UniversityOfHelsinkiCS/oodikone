const { Worker } = require('bullmq')
const moment = require('moment')

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
  concurrency: 2,
})

worker.on('completed', job => {
  const timeUsed = moment.duration(moment(job.finishedOn).diff(job.processedOn, undefined, true))
  const formattedTime =
    timeUsed.asSeconds() > 60
      ? `${timeUsed.asMinutes().toFixed(3)} minutes`
      : `${timeUsed.asSeconds().toFixed(3)} seconds`
  logger.info(`Completed job: ${job.id} (took ${formattedTime})`)
})

// If there is no error event listener, the worker stops taking jobs after any error.
worker.on('error', error => {
  logger.error('Job returned error:')
  logger.error(error.toString())
})

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed. ${error.stack ?? ''}`)
})

worker.on('active', job => {
  logger.info(`Started job: ${job.id}`)
})
