import { Request, Response, Router } from 'express'

import { getLanguageCenterData } from '../services/languageCenterData'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { user } = req
  if (!user.isAdmin && !user.iamGroups.includes('grp-kielikeskus-esihenkilot')) {
    return res.status(403).json({ error: 'Request failed because of missing rights' })
  }
  const result = await getLanguageCenterData()
  return res.json(result)
})

export default router
