const { Queue, FlowProducer } = require('bullmq')

const { redis } = require('../config')

const connection = {
  host: redis,
  port: 6379,
}

const defaultJobOptions = {
  attempts: 3,
  removeOnComplete: true,
  removeOnFail: true,
  backoff: {
    type: 'exponential',
    delay: 60 * 1000,
  },
}

const queueName = 'refresh-redis-data'

const queue = new Queue(queueName, {
  connection,
  defaultJobOptions,
})

const flowProducer = new FlowProducer({
  connection,
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
  teacherLeaderboard: () => addJob('teacherLeaderboard'),
  languagecenter: () => addJob('languagecenter'),
  studyplansUpdate: days => addJob('studyplansUpdate', { days }, 7200),
  closeToGraduation: () => addJob('closeToGraduation'),
}

const addToFlow = async (facultyCode, programmeCodes) => {
  await flowProducer.add({
    name: `faculty-${facultyCode}`,
    data: {
      code: facultyCode,
    },
    queueName,
    children: programmeCodes.map(programmeCode => ({
      name: `programme-${programmeCode}`,
      data: {
        code: programmeCode,
      },
      queueName,
      opts: {
        jobId: `programme-${programmeCode}`,
        ...defaultJobOptions,
      },
    })),
    opts: {
      jobId: `faculty-${facultyCode}`,
      ...defaultJobOptions,
    },
  })
}

module.exports = {
  jobMaker,
  getJobs,
  removeWaitingJobs,
  defaultJobOptions,
  queueName,
  addToFlow,
}
