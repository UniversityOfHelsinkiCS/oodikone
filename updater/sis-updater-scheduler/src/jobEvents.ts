import { setupPurge } from './purge'
import { queue, queueEvents } from './queue'

// This cannot be in queue.ts since it would cause a circular dependency
queueEvents.on('completed', async ({ jobId }) => {
  const job = await queue.getJob(jobId)
  if (job?.name === 'prepurge_start') {
    await setupPurge(job.returnvalue)
  }
})
