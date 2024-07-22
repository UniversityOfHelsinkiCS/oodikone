import { Request, Response, Router } from 'express'
import { omit } from 'lodash'

import { FormattedUser } from '../types'
import { ApplicationError } from '../util/customErrors'

const router = Router()

interface CustomRequest extends Request {
  user?: FormattedUser
  logoutUrl?: string
}

router.get('/', async (req: CustomRequest, res: Response) => {
  const { user, logoutUrl } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  if (!logoutUrl) {
    throw new ApplicationError('Logout URL is missing')
  }

  res.send({
    user: omit(user, ['studentsUserCanAccess']),
    logoutUrl,
  })
})

export default router
