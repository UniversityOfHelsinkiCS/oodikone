import express, { Request, Response, NextFunction } from 'express'

import 'express-async-errors'
import { SECRET_TOKEN, REDIS_LATEST_MESSAGE_RECEIVED } from './config'
import { sendToSlack } from './purge'
import { queue } from './queue'
import {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
} from './scheduler'
import { logger } from './utils/logger'
import { redisClient } from './utils/redis'

const bakeMessage =
  (res: Response) =>
  (message = '', status = 200) => {
    res.status(status).json({ message })
  }

const message = (_: Request, res: Response, next: NextFunction) => {
  res.locals.msg = bakeMessage(res)
  next()
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.token === SECRET_TOKEN) {
    next()
    return
  }
  res.locals.msg('Token missing or invalid', 403)
}

const errorBoundary = (error: Error, _: Request, res: Response, next: NextFunction) => {
  logger.error(error.stack)
  res.locals.msg('Internal server error', 500)
  next(error)
}

const app = express()
app.use(express.json())
app.use(message)

/** Used for checking if backend is up eg. Docker healthchecks */
app.get('/health', (_, res) => {
  return res.status(200).json({ status: 'healthy' })
})

app.get('/healthcheck', async (_, res) => {
  const latestMessage = await redisClient.get(REDIS_LATEST_MESSAGE_RECEIVED)
  const threshold = new Date().getTime() - 1000 * 60 * 60 * 6 // 6 hours ago
  if (!latestMessage || new Date(latestMessage).getTime() < threshold) {
    res.status(400).send()
    return
  }
  res.status(200).send()
  return
})

app.use(auth)

app.get('/meta', async (_, res) => {
  await scheduleMeta()

  res.locals.msg('Scheduled meta')
})

app.get('/students', async (_, res) => {
  await scheduleStudents()

  logger.info('Scheduled students')
  res.locals.msg('Scheduled students')
})

app.post('/studyplans', async (req, res) => {
  const studentnumbers = req.body?.studentnumbers ?? []
  const msg = `Scheduling update of ${studentnumbers.length} students whose studyplan has not been updated recently`
  logger.info(msg)
  await sendToSlack(msg)
  await scheduleByStudentNumbers(studentnumbers)
  res.locals.msg('Shceduled studyplans update')
})

app.get('/programmes', async (_, res) => {
  await scheduleProgrammes()

  logger.info('Scheduled programmes')
  res.locals.msg('Scheduled programmes')
})

app.post('/students', async (req, res) => {
  const studentnumbers = (req.body?.studentnumbers ?? []).map((n: string) => (n.startsWith('0') ? n : `0${n}`))

  logger.info(`Scheduling ${studentnumbers.length} custom studentnumbers`)

  await scheduleByStudentNumbers(studentnumbers)
  res.locals.msg('Scheduled studentnumbers')
})

app.get('/rediscache', async (_req, res) => {
  await queue.add('reload_redis', null)
  logger.info('Scheduled redis cache reloading')
  res.locals.msg('Scheduled redis cache reloading')
})

app.get('/nuke_redis', async (_req, res) => {
  await queue.add('nuke_redis', null)
  logger.info('Scheduled wiping of redis')
  res.locals.msg('Scheduled wiping of redis')
})

app.get('/abort', async (_req, res) => {
  const jobCountsBeforeDrain = await queue.getJobCounts()
  await queue.drain()
  const jobCountsAfterDrain = await queue.getJobCounts()
  const differences: Record<string, number> = {}
  for (const key in jobCountsBeforeDrain) {
    const difference = jobCountsBeforeDrain[key] - jobCountsAfterDrain[key]
    if (difference) {
      differences[key] = difference
    }
  }
  const differenceString = Object.entries(differences)
    .map(([jobType, deletedJobs]) => `${deletedJobs} ${jobType} job(s)`)
    .join(', ')
  logger.info(`Removed approximately ${differenceString} from queue`)
  res.locals.msg(`Removed approximately ${differenceString} from queue`)
})

app.post('/courses', async (req, res) => {
  await scheduleByCourseCodes(req.body?.coursecodes ?? [])

  logger.info('Scheduled courses')
  res.locals.msg('Scheduled courses')
})

app.use(errorBoundary)

const PORT = 8082
export const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Scheduler server listening on port ${PORT}`)
  })
}
