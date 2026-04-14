import { Router } from 'express'

import { LANGUAGE_CODES } from '@oodikone/shared/language'
import { CanError } from '@oodikone/shared/routes'
import {
  ChangeLanguageReqBody,
  GetUserByIdParams,
  GetUserByIdResBody,
  GetUserRolesResBody,
  GetUsersResBody,
  ModifyUserRolesReqBody,
  PostUserEmailReqBody,
  UserEmailPreviewResBody,
  UserIDElementsParams,
  UserIDElementsReqBody,
} from '@oodikone/shared/routes/users'
import { tryCatch } from '@oodikone/shared/util'
import { roles } from '../config/roles'
import * as auth from '../middleware/auth'
import { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } from '../services/mailService'
import * as userService from '../services/userService'
import logger from '../util/logger'

const router = Router()

router.get<never, CanError<GetUsersResBody>>('/', auth.roles(['admin']), async (_, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get<never, GetUserRolesResBody>('/roles', auth.roles(['admin']), (_, res) => res.json(roles))

router.get<never, CanError<GetUserByIdResBody>, never, GetUserByIdParams>(
  '/:uid',
  auth.roles(['admin']),
  async (req, res) => {
    const { uid } = req.params
    const { data: user, error } = await tryCatch(userService.findOne(uid))
    if (error) return res.status(400).json({ error: error.message })

    return res.json(user)
  }
)

router.post<never, CanError<void, Error>, ModifyUserRolesReqBody>(
  '/modify-roles',
  auth.roles(['admin']),
  async (req, res) => {
    const { username, roles } = req.body
    const { error } = await tryCatch(userService.modifyAccess(username, roles))
    if (error) return res.status(400).json(error)

    return res.status(204).end()
  }
)

router.get<never, CanError<UserEmailPreviewResBody>>('/email/preview', auth.roles(['admin']), (_, res) => {
  const { accessMessageSubject, accessMessageText } = previewNotificationAboutAccessToUser()
  res.json({ subject: accessMessageSubject, html: accessMessageText })
})

router.post<never, CanError<void>, PostUserEmailReqBody>('/email', auth.roles(['admin']), async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email address is missing' })

  const { error } = await tryCatch(sendNotificationAboutAccessToUser(email))
  if (error) return res.status(500).json({ error: error.message })

  logger.info('Succesfully sent message about Oodikone access to user')
  return res.status(200).end()
})

router.post<never, CanError<void>, UserIDElementsReqBody, UserIDElementsParams>(
  '/:uid/elements',
  auth.roles(['admin']),
  async (req, res) => {
    const { uid } = req.params
    const { codes } = req.body
    await userService.modifyElementDetails(uid, codes, true)
    res.status(204).end()
  }
)

router.delete<never, CanError<void>, UserIDElementsReqBody, UserIDElementsParams>(
  '/:uid/elements',
  auth.roles(['admin']),
  async (req, res) => {
    const { uid } = req.params
    const { codes } = req.body
    await userService.modifyElementDetails(uid, codes, false)
    res.status(204).end()
  }
)

router.post<never, CanError<void>, ChangeLanguageReqBody>('/language', async (req, res) => {
  const { language } = req.body

  if (!LANGUAGE_CODES.includes(language)) {
    return res.status(400).json({ error: 'Invalid language' })
  }

  const { error } = await tryCatch(userService.updateUser(req.user.username, { language }))
  if (error) return res.status(500).json({ error: error.message })

  return res.status(204).end()
})

export default router
