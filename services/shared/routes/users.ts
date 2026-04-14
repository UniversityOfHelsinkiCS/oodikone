import { Language } from '../language'
import { Role } from '../types'
import { FormattedUser } from '../types/user'

export type ChangeLanguageReqBody = { language: Language }
export type UserIDElementsParams = { uid: string }
export type UserIDElementsReqBody = { codes: string[] }
export type PostUserEmailReqBody = { email: string }
export type UserEmailPreviewResBody = {
  subject: string
  html: string
}
export type ModifyUserRolesReqBody = {
  username: string
  roles: Record<Role, boolean>
}
export type GetUserRolesResBody = readonly string[]
export type GetUserByIdParams = { uid: string }
export type GetUserByIdResBody = Omit<FormattedUser, 'studentsUserCanAccess' | 'isAdmin' | 'mockedBy' | 'userId'>
export type GetUsersResBody = Omit<FormattedUser, 'studentsUserCanAccess' | 'isAdmin' | 'mockedBy' | 'userId'>[]
