const Sentry = require('@sentry/node')
// eslint-disable-next-line no-redeclare
const { Worker } = require('bullmq')
const dayjs = require('dayjs')

const { redis, concurrentWorkers } = require('../config')
const logger = require('../util/logger')
const { queueName } = require('./queue')

const connection = {
  host: redis,
  port: 6379,
}

// https://github.com/taskforcesh/bullmq/issues/2075#issuecomment-1646079335
process.execArgv = process.execArgv.filter(arg => !arg.includes('--max_old_space_size='))

const worker = new Worker(queueName, `${__dirname}/processor.js`, {
  connection,
  useWorkerThreads: true,
  concurrency: concurrentWorkers,
})

worker.on('completed', job => {
  const timeUsedInSeconds = dayjs(job.finishedOn).diff(job.processedOn, 'seconds', true)
  const timeUsedInMinutes = timeUsedInSeconds / 60

  const formattedTime =
    timeUsedInSeconds > 60 ? `${timeUsedInMinutes.toFixed(3)} minutes` : `${timeUsedInSeconds.toFixed(3)} seconds`

  logger.info(`Completed job: ${job.id} (took ${formattedTime})`)
})

// If there is no error event listener, the worker stops taking jobs after any error.
worker.on('error', error => {
  logger.error('Job returned error:')
  logger.error(error.toString())
  Sentry.captureException(error)
})

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed. ${error.stack ?? ''}`)
  Sentry.captureException(error)
})

worker.on('active', job => {
  const attemptInfo = job.attemptsStarted > 1 ? `(attempt ${job.attemptsStarted}/${job.opts.attempts})` : ''
  logger.info(`Started job: ${job.id} ${attemptInfo}`)
})
