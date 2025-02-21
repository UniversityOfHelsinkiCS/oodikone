import { Language } from '@/shared/language'
import { DetailedProgrammeRights, Role } from '@/shared/types'

export type User = {
  email: string
  iamGroups: string[]
  id: string
  language: Language
  lastLogin: string
  name: string
  programmeRights: DetailedProgrammeRights[]
  roles: Role[]
  sisPersonId: string
  username: string
}

export type Email = {
  html: string
  subject: string
}
