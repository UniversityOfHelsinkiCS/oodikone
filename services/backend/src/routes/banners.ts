import { Request, Response, Router } from 'express'

import { Banner } from '@oodikone/shared/models/kone'
import { saveBanner, getActiveBanners, getAllBanners } from '../services/banners'

const router = Router()

router.get<never, Banner[]>('/', async (_req: Request, res: Response) => {
  const banners = await getActiveBanners()
  res.json(banners).end()
})

router.get<never, Banner[]>('/all', async (req: Request, res: Response) => {
  const { user } = req
  if (!user.isAdmin || !user.iamGroups.includes('grp-toska')) {
    return res.status(403).end()
  }

  const banners = await getAllBanners()
  res.json(banners)
})

router.post('/new', async (req: Request, res: Response) => {
  const { user } = req
  if (!user.isAdmin || !user.iamGroups.includes('grp-toska')) {
    return res.status(403).end()
  }

  const payload = {
    ...req.body,
    lastModifiedBy: user.username,
  }

  await saveBanner(payload)
  res.status(201).end()
})

router.put('/update', async (req: Request, res: Response) => {
  const { user } = req
  if (!user.isAdmin || !user.iamGroups.includes('grp-toska')) {
    return res.status(403).end()
  }

  const payload = {
    ...req.body,
    lastModifiedBy: user.username,
  }

  await saveBanner(payload)
  res.status(201).end()
})

export default router
