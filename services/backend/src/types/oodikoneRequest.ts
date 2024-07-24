/* eslint-disable import/no-cycle */
import { Request } from 'express'

import { FormattedUser } from './user'

export interface OodikoneRequest extends Request {
  user?: FormattedUser
  logoutUrl?: string
}
