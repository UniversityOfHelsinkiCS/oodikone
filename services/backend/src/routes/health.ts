import { Router } from 'express'

const router = Router()

/** Used for checking if backend is up eg. Docker healthchecks */
router.get<never, { status: string }>('/', (_, res) => {
  return res.status(200).json({ status: 'healthy' })
})

export default router
