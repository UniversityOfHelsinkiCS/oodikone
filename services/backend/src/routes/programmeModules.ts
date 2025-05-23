import { Request, Response, Router } from 'express'

import { getCoursesAndModules, getCurriculumOptions } from '../services/programmeModules'

const router = Router()

router.get('/v3/curriculum-options/:code', async (req: Request, res: Response) => {
  const { code } = req.params
  const result = await getCurriculumOptions(code)
  res.json(result)
})

router.get('/v3/curriculum/:code/:periodIds', async (req: Request, res: Response) => {
  const { code, periodIds } = req.params
  const result = await getCoursesAndModules(code, periodIds)
  res.json({
    defaultProgrammeCourses: result.defaultProgrammeCourses.courses,
    defaultProgrammeModules: result.defaultProgrammeCourses.modules,
    secondProgrammeCourses: result.secondProgrammeCourses?.courses,
    secondProgrammeModules: result.secondProgrammeCourses?.modules,
  })
})

export default router
