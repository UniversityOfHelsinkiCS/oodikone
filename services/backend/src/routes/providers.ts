import { Request, Response, Router } from 'express'

import { getAllProviders } from '../services/providers'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const providers = await getAllProviders()
  res.json(providers)
})

export default router
