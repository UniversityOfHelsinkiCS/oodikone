import { Request, Response, Router } from 'express'

import { getSemestersAndYears } from '../services/semesters'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const providers = await getSemestersAndYears()
  res.json(providers)
})

export default router
