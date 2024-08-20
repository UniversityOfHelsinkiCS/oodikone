import { Request, Response, Router } from 'express'

import { roles } from '../config/roles'
import * as auth from '../middleware/auth'
import { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } from '../services/mailService'
import * as userService from '../services/userService'
import { LANGUAGE_CODES } from '../shared/language'
import { Language } from '../types'
import logger from '../util/logger'

const router = Router()

router.get('/', auth.roles(['admin']), async (_req: Request, res: Response) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', auth.roles(['admin']), async (_req: Request, res: Response) => {
  res.json(roles)
})

interface UidRequest extends Request {
  params: {
    uid: string
  }
}

router.get('/:uid', auth.roles(['admin']), async (req: UidRequest, res: Response) => {
  try {
    const { uid } = req.params
    const user = await userService.findOne(uid)
    return res.json(user)
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
})

interface ModifyAccessRequest extends Request {
  body: {
    username: string
    accessgroups: Record<string, boolean>
  }
}

router.post('/modifyaccess', auth.roles(['admin']), async (req: ModifyAccessRequest, res: Response) => {
  const { username, accessgroups } = req.body
  try {
    await userService.modifyAccess(username, accessgroups)
    res.status(204).end()
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get('/email/preview', auth.roles(['admin']), (_req: Request, res: Response) => {
  const { accessMessageSubject, accessMessageText } = previewNotificationAboutAccessToUser()
  res.json({ subject: accessMessageSubject, html: accessMessageText })
})

interface EmailRequest extends Request {
  body: {
    email: string
  }
}

router.post('/email', auth.roles(['admin']), async (req: EmailRequest, res: Response) => {
  const userEmail = req.body.email
  if (!userEmail) {
    return res.status(400).json({ error: 'Email address is missing' })
  }

  try {
    await sendNotificationAboutAccessToUser(userEmail)
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
  logger.info('Succesfully sent message about Oodikone access to user')
  res.status(200).end()
})

interface ElementsRequest extends Request {
  params: {
    uid: string
  }
  body: {
    codes: string[]
  }
}

router.post('/:uid/elements', auth.roles(['admin']), async (req: ElementsRequest, res: Response) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, true)
  res.status(204).end()
})

router.delete('/:uid/elements', auth.roles(['admin']), async (req: ElementsRequest, res: Response) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, false)
  res.status(204).end()
})

interface ChangeLanguageRequest extends Request {
  body: {
    language: Language
  }
}

router.post('/language', async (req: ChangeLanguageRequest, res: Response) => {
  const {
    body: { language },
  } = req
  if (!LANGUAGE_CODES.includes(language)) {
    return res.status(400).json('Invalid language')
  }
  try {
    await userService.updateUser(req.user.username, { language })
    return res.status(204).end()
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

export default router
