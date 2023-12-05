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
})

queue.on('completed', job => {
  logger.info(`Completed job: ${job.id}`)
  console.log(JSON.stringify(job, null, 2))
})

queue.on('stalled', job => {
  logger.info(`Stalled job: ${job.id}`)
})

worker.on('active', job => {
  logger.info(`Started job: ${job.id}`)
})

// If there is no error event listener, the worker stops taking jobs after any error.
worker.on('error', err => {
  logger.error(`Job failed with error:`)
  logger.error(err)
})

const addJob = (type, code) => {
  // job name (first arg) makes the job unique, and we want unique based on faculty/programme code
  const name = code ? `${type}-${code}` : type
  queue.add(
    name,
    { code },
    {
      jobId: name,
      removeOnComplete: true,
      removeOnFail: true,
      keepJobs: 0,
    }
  )
}

const getJobs = async type => {
  const jobs = await queue.getJobs(type)
  return jobs
}

const jobMaker = {
  statistics: () => addJob('statistics'),
  faculties: code => addJob(`faculties`, code),
  trends: () => addJob('trends'),
  overviews: code => addJob(`overviews`, code),
  languagecenter: () => addJob('languagecenter'),
}

module.exports = { jobMaker, getJobs }
