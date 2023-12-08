const { Queue } = require('bullmq')
const { redis } = require('../conf-backend')

const connection = {
  host: redis,
  port: 6379,
}

const queue = new Queue('refresh-redis-data', { connection })

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
  faculty: code => addJob('faculty', code),
  programme: code => addJob('programme', code),
  statistics: () => addJob('statistics'),
  trends: () => addJob('trends'),
  languagecenter: () => addJob('languagecenter'),
}

module.exports = { jobMaker, getJobs }
