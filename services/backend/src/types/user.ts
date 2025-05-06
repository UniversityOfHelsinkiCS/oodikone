import { InferAttributes } from 'sequelize'

import { Language } from '@oodikone/shared/language'
import { DetailedProgrammeRights, Role } from '@oodikone/shared/types'
import { User } from '../models/user'

export type ExpandedUser = InferAttributes<User> & {
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
