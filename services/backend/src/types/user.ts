import { Language } from '@oodikone/shared/language'
import type { User } from '@oodikone/shared/models/user'
import { DetailedProgrammeRights, Role } from '@oodikone/shared/types'

export type ExpandedUser = User & {
  iamGroups: string[]
  mockedBy?: string | undefined
  detailedProgrammeRights: DetailedProgrammeRights[]
}

export type FormattedUser = {
  id: string
  userId: string
  username: string
  name: string
  language: Language
  sisPersonId: string
  email: string
  roles: Role[]
  studentsUserCanAccess: string[]
  isAdmin: boolean
  programmeRights: DetailedProgrammeRights[]
  iamGroups: string[]
  mockedBy: string | undefined
  lastLogin: Date
}
