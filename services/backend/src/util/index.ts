import { Role } from '../types'

/** Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export const createLocaleComparator = (field: string | null = null) => {
  if (!field) {
    return (val1: string, val2: string) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  }
  return (val1: string, val2: string) => val1[field].localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

export const getFullStudyProgrammeRights = programmeRights => {
  return programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)
}

export const hasFullAccessToStudentData = (roles: Role[]): boolean => {
  const rolesWithFullAccess = ['admin', 'fullSisuAccess']
  return roles?.some(role => rolesWithFullAccess.includes(role))
}

export const splitByEmptySpace = (str: string): string[] => str.split(/\s+/g)

export const validateParamLength = (param: string, minLength: number): boolean => {
  return param && param.trim().length >= minLength
}

export const sortByProgrammeCode = (a: string, b: string) => {
  const getPrefixPriority = (code: string): 1 | 2 | 3 => {
    if (code.startsWith('KH')) return 1
    if (code.startsWith('MH')) return 2
    return 3
  }

  const priorityA = getPrefixPriority(a)
  const priorityB = getPrefixPriority(b)
  if (priorityA !== priorityB) {
    return priorityA - priorityB
  }
  return a.localeCompare(b)
}
