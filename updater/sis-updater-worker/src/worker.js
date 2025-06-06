// eslint-disable-next-line no-redeclare
import { Worker } from 'bullmq'

import { REDIS_HOST, REDIS_PORT } from './config.js'
import processor from './processor.js'
import logger from './utils/logger.js'

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
}

const worker = new Worker('updater-queue', processor, { connection })

worker.on('completed', job => {
  logger.info({
    message: `Job ${job.id} completed`,
    type: job.name,
    count: job.data?.length,
    timems: job.finishedOn - job.processedOn,
  })
})

worker.on('error', error => {
  logger.error('Job returned error:')
  logger.error(error.toString())
})

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed. ${error.stack ?? ''}`)
})

worker.on('active', job => {
  logger.info({
    message: `Started job ${job.id}`,
    type: job.name,
    count: job.data?.length,
  })
})
