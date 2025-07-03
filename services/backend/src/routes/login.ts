import { Router } from 'express'

import { CanError } from '@oodikone/shared/routes'
import { omitKeys } from '@oodikone/shared/util'
import { FormattedUser } from '../types/user'
import { ApplicationError } from '../util/customErrors'

const router = Router()

type LoginReqBody = never
type LoginResBody = {
  user: Omit<FormattedUser, 'studentsUserCanAccess'>
  logoutUrl?: string
}

router.get<never, CanError<LoginResBody>, LoginReqBody>('/', (req, res) => {
  const { user, logoutUrl } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    user: omitKeys(user, ['studentsUserCanAccess']),
    logoutUrl,
  })
})

export default router
