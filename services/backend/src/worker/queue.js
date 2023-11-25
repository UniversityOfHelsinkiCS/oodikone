const { Worker, Queue } = require('bullmq')
const logger = require('../util/logger')
const { redis } = require('../conf-backend')

const connection = {
  host: redis,
  port: 6379,
}

// https://github.com/taskforcesh/bullmq/issues/2075#issuecomment-1646079335
process.execArgv = process.execArgv.filter(arg => !arg.includes('--max_old_space_size='))

const queue = new Queue('refresh-redis-data', { connection })

queue.on('waiting', job => {
  logger.info(`Job waiting: ${job.id}`)
})

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
  logger.error(`Job failed with error:`)
  logger.error(err)
})

const addJob = type => {
  queue.add(type, null, {
    jobId: type,
    removeOnComplete: true,
    removeOnFail: true,
    keepJobs: 0,
  })
}

const getJobs = async type => {
  const jobs = await queue.getJobs(type)
  return jobs
}

const jobMaker = {
  statistics: () => addJob('statistics'),
  faculties: () => addJob('faculties'),
  trends: () => addJob('trends'),
  overviews: () => addJob('overviews'),
  languagecenter: () => addJob('languagecenter'),
}

module.exports = { jobMaker, getJobs }
