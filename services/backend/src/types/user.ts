import { InferAttributes } from 'sequelize'

import { User } from '../models/user'
import { Language } from '../shared/language'
import { Role } from '../shared/types'
import { DetailedProgrammeRights } from './detailedProgrammeRights'

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
