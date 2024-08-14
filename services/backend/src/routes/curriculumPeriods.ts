import { Request, Response, Router } from 'express'

import { CurriculumPeriod } from '../models'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const result = await CurriculumPeriod.findAll()
  res.json(result)
})

export default router
