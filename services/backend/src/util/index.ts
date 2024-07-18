import { DetailedProgrammeRights, Role } from '../types'

type Comparator = (val1: string, val2: string) => number
type FieldComparator = (val1: Record<string, any>, val2: Record<string, any>) => number

/**
 * Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param field The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export function createLocaleComparator(field: string): FieldComparator
export function createLocaleComparator(): Comparator
export function createLocaleComparator(field?: string): Comparator | FieldComparator {
  const comparator: Comparator = (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  if (!field) {
    return comparator
  }

  return (val1: Record<string, any>, val2: Record<string, any>) => {
    const fieldVal1 = val1[field]
    const fieldVal2 = val2[field]

    if (typeof fieldVal1 === 'string' && typeof fieldVal2 === 'string') {
      return comparator(fieldVal1, fieldVal2)
    }
    if (fieldVal1 === fieldVal2) {
      return 0
    }
    if (fieldVal1 > fieldVal2) {
      return 1
    }
    return -1
  }
}

export const getFullStudyProgrammeRights = (detailedProgrammeRights: DetailedProgrammeRights[]) => {
  return detailedProgrammeRights.filter(({ limited }) => !limited).map(({ code }) => code)
}

export const hasFullAccessToStudentData = (roles?: Role[]) => {
  const rolesWithFullAccess: Role[] = ['admin', 'fullSisuAccess']
  return roles != null && roles.some(role => rolesWithFullAccess.includes(role))
}

export const splitByEmptySpace = (str: string) => str.split(/\s+/g)

export const validateParamLength = (param: any, minLength: number) => {
  return typeof param === 'string' && param.trim().length >= minLength
}

export const sortByProgrammeCode = (a: string, b: string) => {
  const getPrefixPriority = (code: string) => {
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
