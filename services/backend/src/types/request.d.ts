import { FormattedUser } from './user'

declare global {
  namespace Express {
    export interface Request {
      user: FormattedUser
      logoutUrl: string | undefined
    }
  }
}
