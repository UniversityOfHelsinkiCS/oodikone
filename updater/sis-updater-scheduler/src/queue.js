const { Queue, QueueEvents } = require('bullmq')

const { REDIS_HOST, REDIS_PORT } = require('./config')

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
}

const queue = new Queue('updater-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
    },
  },
})

const queueEvents = new QueueEvents('updater-queue', { connection })

module.exports = {
  queue,
  queueEvents,
}
