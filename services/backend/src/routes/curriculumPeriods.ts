import { Request, Response, Router } from 'express'

import { CurriculumPeriodModel } from '../models'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const result = await CurriculumPeriodModel.findAll()
  res.json(result)
})

export default router
