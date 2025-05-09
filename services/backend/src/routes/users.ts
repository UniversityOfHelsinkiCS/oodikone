import { Request, Response, Router } from 'express'

import { LANGUAGE_CODES, Language } from '@oodikone/shared/language'
import { Role } from '@oodikone/shared/types'
import { tryCatch } from '@oodikone/shared/util'
import { roles } from '../config/roles'
import * as auth from '../middleware/auth'
import { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } from '../services/mailService'
import * as userService from '../services/userService'
import logger from '../util/logger'

const router = Router()

router.get('/', auth.roles(['admin']), async (_req: Request, res: Response) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/roles', auth.roles(['admin']), (_req: Request, res: Response) => {
  res.json(roles)
})

interface UidRequest extends Request {
  params: {
    uid: string
  }
}

router.get('/:uid', auth.roles(['admin']), async (req: UidRequest, res: Response) => {
  const { uid } = req.params
  const { data: user, error } = await tryCatch(userService.findOne(uid))
  if (error) return res.status(400).json({ error: error.message })

  return res.json(user)
})

interface ModifyRolesRequest extends Request {
  body: {
    username: string
    roles: Record<Role, boolean>
  }
}

router.post('/modify-roles', auth.roles(['admin']), async (req: ModifyRolesRequest, res: Response) => {
  const { username, roles } = req.body
  const { error } = await tryCatch(userService.modifyAccess(username, roles))

  if (error) {
    return res.status(400).json(error)
  }

  return res.status(204).end()
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
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email address is missing' })

  const { error } = await tryCatch(sendNotificationAboutAccessToUser(email))
  if (error) return res.status(500).json({ error: error.message })

  logger.info('Succesfully sent message about Oodikone access to user')
  return res.status(200).end()
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
  const { language } = req.body

  if (!LANGUAGE_CODES.includes(language)) {
    return res.status(400).json('Invalid language')
  }

  const { error } = await tryCatch(userService.updateUser(req.user.username, { language }))
  if (error) return res.status(500).json({ error: error.message })

  return res.status(204).end()
})

export default router
