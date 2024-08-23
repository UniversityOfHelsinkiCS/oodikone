import { Request, Response, Router } from 'express'

import { languageCenterViewEnabled } from '../config'

import { getLanguageCenterData } from '../services/languageCenterData'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { user } = req
  if (!user.isAdmin && !user.iamGroups.includes('grp-kielikeskus-esihenkilot')) {
    return res.status(403).json({ error: 'Request failed because of missing rights' })
  }
  if (!languageCenterViewEnabled)
    return res.status(418).json({ error: 'The language center functionality is not activated in your environment.' })
  const result = await getLanguageCenterData()
  return res.json(result)
})

export default router
