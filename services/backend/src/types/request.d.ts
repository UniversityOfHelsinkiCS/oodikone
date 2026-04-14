import { FormattedUser } from '@oodikone/shared/types'

declare global {
  namespace Express {
    export interface Request {
      user: FormattedUser
      logoutUrl: string | undefined
    }
  }
}
