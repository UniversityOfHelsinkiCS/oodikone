import type { Language } from '../language'
import type { Optional, Role } from '../types'

export type UserCreation = Optional<User, 'id' | 'language' | 'roles' | 'programmeRights'>
export type User = {
  id: string
  fullName: string
  username: string
  email: string
  language: Language
  sisuPersonId: string
  lastLogin: Date
  roles: Role[]
  programmeRights: string[]
}
