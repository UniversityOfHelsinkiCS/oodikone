import { intersection } from 'lodash'

import { DetailedProgrammeRights, Role } from '@/shared/types'

export const checkUserAccess = (requiredRoles: Role[], roles: Role[]) => {
  return intersection(requiredRoles, roles).length > 0
}

export const getFullStudyProgrammeRights = (programmeRights: DetailedProgrammeRights[]) => {
  if (programmeRights) {
    return programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)
  }

  return []
}

export const userHasAccessToAllCourseStats = (roles: Role[], studyProgrammeRights: string[]) => {
  return roles.some(role => ['admin', 'fullSisuAccess'].includes(role)) || studyProgrammeRights.length > 0
}
