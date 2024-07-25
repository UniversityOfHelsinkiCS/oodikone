import { Response, Router } from 'express'

import {
  getCriteria,
  saveYearlyCourseCriteria,
  saveYearlyCreditCriteria,
} from '../services/studyProgramme/studyProgrammeCriteria'
import { OodikoneRequest } from '../types'

const router = Router()

interface StudyProgrammeCriteriaRequest extends OodikoneRequest {
  query: {
    programmecode: string
  }
}

router.get('/', async (req: StudyProgrammeCriteriaRequest, res: Response) => {
  const studyProgramme = req.query.programmecode
  if (studyProgramme !== '' && !studyProgramme) {
    return res.status(422).end()
  }
  const studyProgrammeCriteria = await getCriteria(studyProgramme as string)
  return res.json(studyProgrammeCriteria)
})

interface CriteriaCoursesRequest extends OodikoneRequest {
  body: {
    code: string
    courses: string[]
    year: number
  }
}

router.post('/courses', async (req: CriteriaCoursesRequest, res: Response) => {
  const { code, courses, year } = req.body
  if (!code || !courses || !year) {
    return res.status(400).end()
  }
  const studyProgrammeCriteria = await saveYearlyCourseCriteria(code, courses, year)
  return res.json(studyProgrammeCriteria)
})

interface CriteriaCreditsRequest extends OodikoneRequest {
  body: {
    code: string
    credits: Record<string, string>
  }
}

router.post('/credits', async (req: CriteriaCreditsRequest, res: Response) => {
  const { code, credits } = req.body
  if (!code || !credits) {
    return res.status(400).end()
  }
  const studyProgrammeCriteria = await saveYearlyCreditCriteria(code, credits)
  return res.json(studyProgrammeCriteria)
})

export default router
