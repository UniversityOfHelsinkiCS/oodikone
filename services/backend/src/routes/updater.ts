import { Request, Response, Router } from 'express'

import { languageCenterViewEnabled } from '../config'
import { refreshFaculties, refreshProgrammes } from '../events'
import {
  abortUpdate,
  updateSISCoursesByCourseCode,
  updateSISMetadata,
  updateSISProgrammes,
  updateSISRedisCache,
  updateSISStudents,
  updateSISStudentsByStudentNumber,
} from '../services/sisUpdaterService'
import logger from '../util/logger'
import { getJobs, jobMaker, removeWaitingJobs } from '../worker/queue'

const router = Router()

const refreshFacultiesByList = (facultyCodes: string[]) => {
  facultyCodes.forEach(code => jobMaker.faculty(code))
  return 'Added jobs for refreshing faculties'
}

const refreshProgrammesByList = (programmeCodes: string[]) => {
  programmeCodes.forEach(code => jobMaker.programme(code))
  return 'Added jobs for refreshing programme'
}

router.get('/update/v2/meta', async (_req: Request, res: Response) => {
  const response = await updateSISMetadata()
  if (response) {
    res.status(200).json('Update SIS meta scheduled')
  }
})

router.get('/update/v2/students', async (_req: Request, res: Response) => {
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

router.post('/update/v2/customlist/:type', async (req: PostCustomListRequest, res: Response) => {
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

router.post('/update/v2/courses', async (req: Request, res: Response) => {
  const response = await updateSISCoursesByCourseCode(req.body)
  if (response) {
    res.status(200).json('Update SIS courses scheduled')
  }
})

router.get('/update/v2/programmes', async (_req: Request, res: Response) => {
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

router.post('/refresh_statistic_v2', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of statistics`)
  jobMaker.statistics()
  res.status(200).json('Teacher and study programme statistics refreshed')
})

router.post('/refresh_study_programmes_v2', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of study programmes`)
  refreshProgrammes()
  res.status(200).json('Added job for refreshing study programme overviews')
})

router.post('/refresh_faculties_v2', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of faculties`)
  refreshFaculties()
  res.status(200).json('Added job for refreshing faculties')
})

router.post('/refresh_language_center_data', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of language center data`)
  if (!languageCenterViewEnabled)
    res.status(418).json({ error: 'The language center functionality is not activated in your environment.' })
  jobMaker.languagecenter()
  res.status(200).json('Added job for refreshing language center data')
})

router.post('/refresh-close-to-graduation', async (req: Request, res: Response) => {
  logger.info(`${req.user.username} requested refresh of close to graduation data`)
  jobMaker.closeToGraduation()
  res.status(200).json('Added job for refreshing close to graduation data')
})

router.get('/abort', async (_req: Request, res: Response) => {
  await abortUpdate()
  res.status(200).json()
})

router.get('/jobs', async (_req: Request, res: Response) => {
  const waiting = await getJobs('waiting')
  const active = await getJobs('active')
  res.status(200).json({ waiting, active })
})

router.delete('/jobs', async (_req: Request, res: Response) => {
  await removeWaitingJobs()
  res.status(200).end()
})

export default router
