const { Queue } = require('bullmq')

const { redis } = require('../config')

const connection = {
  host: redis,
  port: 6379,
}

const queue = new Queue('refresh-redis-data', { connection })

const addJob = (type, data, keep) => {
  // job name (first arg) makes the job unique, and we want unique based on faculty/programme code
  const name = data?.code ? `${type}-${data.code}` : type
  queue.add(
    name,
    { ...data },
    {
      jobId: name,
      removeOnComplete: true,
      removeOnFail: true,
      keepJobs: keep ?? 0,
    }
  )
}

const getJobs = async type => {
  const jobs = await queue.getJobs(type)
  return jobs
}

const removeWaitingJobs = async () => {
  await queue.drain()
}

const jobMaker = {
  faculty: code => addJob('faculty', { code }),
  programme: code => addJob('programme', { code }),
  statistics: () => addJob('statistics'),
  languagecenter: () => addJob('languagecenter'),
  studyplansUpdate: days => addJob('studyplansUpdate', { days }, 7200),
  closeToGraduation: () => addJob('closeToGraduation'),
}

module.exports = { jobMaker, getJobs, removeWaitingJobs }
