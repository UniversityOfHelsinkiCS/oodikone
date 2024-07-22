import { Router } from 'express'

import { getAllProviders } from '../services/providers'

const router = Router()

router.get('/', async (_req, res) => {
  const providers = await getAllProviders()
  res.json(providers)
})

export default router
