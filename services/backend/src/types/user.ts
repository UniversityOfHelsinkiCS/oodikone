/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'

import { User } from '../models/user'
import { DetailedProgrammeRights } from './detailedProgrammeRights'
import { Language } from './language'
import { Role } from './role'

export type ExpandedUser = InferAttributes<User> & {
  iamGroups: string[]
  mockedBy?: string | undefined
  detailedProgrammeRights: DetailedProgrammeRights[]
}

export type FormattedUser = {
  id: bigint
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
