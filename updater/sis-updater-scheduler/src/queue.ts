import { Queue, QueueEvents } from 'bullmq'

import { REDIS_HOST, REDIS_PORT } from './config'

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
}

export const queue = new Queue('updater-queue', {
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

export const queueEvents = new QueueEvents('updater-queue', { connection })
