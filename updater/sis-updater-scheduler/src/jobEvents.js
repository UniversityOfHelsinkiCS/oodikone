const { setupPurge } = require('./purge')
const { queue, queueEvents } = require('./queue')

// This cannot be in queue.js since it would cause a circular dependency
queueEvents.on('completed', async ({ jobId }) => {
  const job = await queue.getJob(jobId)
  if (job && job.name === 'prepurge_start') {
    await setupPurge(job.returnvalue)
  }
})
