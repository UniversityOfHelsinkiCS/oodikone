import { Router } from 'express'

import { CurriculumPeriod } from '@oodikone/shared/models'
import { CurriculumPeriodModel } from '../models'

const router = Router()

type CurriculumPeriodsResBody = CurriculumPeriod[]

router.get<never, CurriculumPeriodsResBody>('/', async (_req, res) => {
  const result: CurriculumPeriod[] = await CurriculumPeriodModel.findAll({
    raw: true,
  })

  res.json(result)
})

export default router
