const { Queue } = require('bullmq')

const { redis } = require('../config')

const connection = {
  host: redis,
  port: 6379,
}

const queue = new Queue('refresh-redis-data', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: true,
    backoff: {
      type: 'exponential',
      delay: 60 * 1000,
    },
  },
})

const addJob = (type, data, keep) => {
  // job name (first arg) makes the job unique, and we want unique based on faculty/programme code
  const name = data?.code ? `${type}-${data.code}` : type
  queue.add(name, { ...data }, { jobId: name, keepJobs: keep ?? 0 })
}

const getJobs = async type => {
  let jobs = []
  if (type === 'waiting') {
    jobs = await queue.getWaiting()
  } else if (type === 'active') {
    jobs = await queue.getActive()
  }
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
