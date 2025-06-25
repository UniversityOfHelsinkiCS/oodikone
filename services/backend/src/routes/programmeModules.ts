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
  const { defaultProgrammeCourses, secondProgrammeCourses } = await getCoursesAndModules(code, periodIds)

  res.json({
    defaultProgrammeCourses: defaultProgrammeCourses.courses,
    defaultProgrammeModules: defaultProgrammeCourses.modules,
    secondProgrammeCourses: secondProgrammeCourses.courses,
    secondProgrammeModules: secondProgrammeCourses.modules,
  })
})

export default router
