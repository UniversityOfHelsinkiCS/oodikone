import { Router } from 'express'

import { CurriculumOption } from '@oodikone/shared/types'
import { getCoursesAndModules, getCurriculumOptions } from '../services/programmeModules'

const router = Router()

type CurriculumOptionParams = { code: string }

router.get<CurriculumOptionParams, CurriculumOption[] | null>('/curriculum-options/:code', async (req, res) => {
  const { code } = req.params
  const result = await getCurriculumOptions(code)
  res.json(result)
})

type CurriculumPeriodParams = { code: string; periodIds: string }

router.get<CurriculumPeriodParams>('/curriculum/:code/:periodIds', async (req, res) => {
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
