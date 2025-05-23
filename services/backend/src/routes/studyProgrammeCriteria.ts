import { Request, Response, Router } from 'express'

import {
  getCriteria,
  saveYearlyCourseCriteria,
  saveYearlyCreditCriteria,
} from '../services/studyProgramme/studyProgrammeCriteria'

const router = Router()

interface StudyProgrammeCriteriaRequest extends Request {
  query: {
    programmeCode: string
  }
}

router.get('/', async (req: StudyProgrammeCriteriaRequest, res: Response) => {
  const studyProgramme = req.query.programmeCode
  if (studyProgramme !== '' && !studyProgramme) {
    return res.status(422).end()
  }
  const studyProgrammeCriteria = await getCriteria(studyProgramme)
  return res.json(studyProgrammeCriteria)
})

interface CriteriaCoursesRequest extends Request {
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
  if (!studyProgrammeCriteria) {
    return res.status(404).end()
  }
  return res.status(201).end()
})

interface CriteriaCreditsRequest extends Request {
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
  if (!studyProgrammeCriteria) {
    return res.status(404).end()
  }
  return res.status(201).end()
})

export default router
