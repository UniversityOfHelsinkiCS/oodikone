import { Role } from '../types'

type Comparator = (val1: string, val2: string) => number
type FieldComparator = (val1: Record<string, string>, val2: Record<string, string>) => number

/**
 * Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param field The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export function createLocaleComparator(field: string): FieldComparator
export function createLocaleComparator(): Comparator
export function createLocaleComparator(field?: string): Comparator | FieldComparator {
  type ValidArrayItem = string | Record<string, string>
  return (val1: ValidArrayItem, val2: ValidArrayItem) => {
    if (typeof val1 === 'string' && typeof val2 === 'string') {
      return val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
    }
    if (
      typeof val1 === 'object' &&
      typeof val2 === 'object' &&
      field &&
      typeof val1[field] === 'string' &&
      typeof val2[field] === 'string'
    ) {
      return val1[field].localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
    }
    throw new Error('Invalid arguments')
  }
}

export const getFullStudyProgrammeRights = programmeRights => {
  return programmeRights.filter(({ limited }) => !limited).map(({ code }) => code)
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

/**
 * Returns the keys of the given object as an array of strings, typed as the keys of the object.
 * @param obj The object whose keys are to be returned.
 */
export const keysOf = <T extends object>(obj: T) => {
  return Object.keys(obj) as Array<keyof T>
}
