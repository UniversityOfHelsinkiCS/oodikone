import { Request, Response, Router } from 'express'

import { refreshFaculties, refreshProgrammes } from '../events'
import {
  abortUpdate,
  nukeRedis,
  updateSISCoursesByCourseCode,
  updateSISMetadata,
  updateSISProgrammes,
  updateSISRedisCache,
  updateSISStudents,
  updateSISStudentsByStudentNumber,
} from '../services/sisUpdaterService'
import logger from '../util/logger'
import { jobQueue } from '../worker/queue'

const router = Router()

const refreshFacultiesByList = (facultyCodes: string[]) => {
  facultyCodes.forEach(code => jobQueue.refreshFaculty(code))
  return 'Added jobs for refreshing faculties'
}

const refreshProgrammesByList = (programmeCodes: string[]) => {
  programmeCodes.forEach(code => jobQueue.refreshProgramme(code))
  return 'Added jobs for refreshing programme'
}

router.get('/update/meta', async (_req: Request, res: Response) => {
  const response = await updateSISMetadata()
  if (response) {
    res.status(200).json('Update SIS meta scheduled')
  }
})

router.get('/update/students', async (_req: Request, res: Response) => {
  const response = await updateSISStudents()
  if (response) {
    res.status(200).json('Update SIS students scheduled')
  }
})

interface PostCustomListRequest extends Request {
  body: string[]
  params: {
    type: string
  }
}

router.post('/update/customlist/:type', async (req: PostCustomListRequest, res: Response) => {
  const { type } = req.params
  const list = req.body
  const typeToJob = {
    students: updateSISStudentsByStudentNumber,
    courses: updateSISCoursesByCourseCode,
    faculties: refreshFacultiesByList,
    programmes: refreshProgrammesByList,
  }
  if (typeof typeToJob[type] !== 'function') {
    return res.status(400).json('Bad job type')
  }
  const response = await typeToJob[type](list)
  if (response) {
    res.status(200).json('Scheduled custom list')
  }
})

router.get('/update/programmes', async (_req: Request, res: Response) => {
  const response = await updateSISProgrammes()
  if (response) {
    res.status(200).json('Update SIS programmes scheduled')
  }
})

router.get('/refresh_redis_cache', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of redis cache`)
  const response = await updateSISRedisCache()
  if (response) {
    res.status(200).json('Refreshing SIS redis cache scheduled')
  }
})

router.get('/nuke_redis', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested complete wipe of redis`)
  const response = await nukeRedis()
  if (response) res.status(200).json('Complete flush of redis scheduled')
})

router.post('/refresh-teacher-leaderboard', (req: Request, res: Response) => {
  logger.info(
    `${req.user.username} requested refresh of teacher leaderboard for the current and previous academic year`
  )
  jobQueue.refreshTeacherLeaderboard()
  res.status(200).json('Teacher leaderboard for the current and previous academic year refreshed')
})

router.post('/refresh_degree_programmes_v2', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of degree programmes`)
  await refreshProgrammes()
  res.status(200).json('Added job for refreshing degree programme overviews')
})

router.post('/refresh_faculties_v2', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of faculties`)
  await refreshFaculties()
  res.status(200).json('Added job for refreshing faculties')
})

router.post('/refresh_language_center_data', (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of language center data`)
  jobQueue.refreshLanguagecenter()
  res.status(200).json('Added job for refreshing language center data')
})

router.post('/refresh-close-to-graduation', (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of close to graduation data`)
  jobQueue.refreshCloseToGraduation()
  res.status(200).json('Added job for refreshing close to graduation data')
})

router.get('/abort', async (_req: Request, res: Response) => {
  const response = await abortUpdate()
  res.status(200).json(response)
})

router.get('/jobs', async (_req: Request, res: Response) => {
  const jobs = await jobQueue.getJobs()
  res.status(200).json(jobs)
})

router.delete('/jobs', async (_req: Request, res: Response) => {
  await jobQueue.clearWaitingJobs()
  res.status(200).end()
})

export default router
