import * as Sentry from '@sentry/node'

import { ProgrammeModule } from '../models'
import { DetailedProgrammeRights, Role } from '../shared/types'

const isObjectWithKey = (obj: unknown, key: string): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj
}

/**
 * Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param key The key to sort by (optional: if not given, the function will sort by the strings themselves)
 * @param desc If true, the function will sort in descending order (optional: defaults to `false`)
 */
export const createLocaleComparator = (key?: string, desc = false) => {
  return (val1: unknown, val2: unknown): number => {
    let val1ToCompare: unknown
    let val2ToCompare: unknown

    if (key) {
      if (isObjectWithKey(val1, key) && isObjectWithKey(val2, key)) {
        val1ToCompare = val1[key]
        val2ToCompare = val2[key]
      } else {
        throw new Error('Invalid arguments: expected objects with the specified key')
      }
    } else {
      val1ToCompare = val1
      val2ToCompare = val2
    }

    if (typeof val1ToCompare !== 'string' || typeof val2ToCompare !== 'string') {
      throw new Error('Invalid arguments: expected strings or objects with string properties')
    }

    const comparisonResult = val1ToCompare.localeCompare(val2ToCompare, 'fi', { sensitivity: 'accent' })

    return desc ? -comparisonResult : comparisonResult
  }
}

export const getFullStudyProgrammeRights = (detailedProgrammeRights: DetailedProgrammeRights[]) => {
  return detailedProgrammeRights.filter(({ limited }) => !limited).map(({ code }) => code)
}

export const hasFullAccessToStudentData = (roles?: Role[]) => {
  const rolesWithFullAccess: Role[] = ['admin', 'fullSisuAccess']
  return !!roles?.some(role => rolesWithFullAccess.includes(role))
}

export const isOpenUniCourseCode = (code: string) => /^AY?(.+?)(?:en|fi|sv)?$/.exec(code)

/**
 * Returns the keys of the given object as an array of strings, typed as the keys of the object.
 * @param obj The object whose keys are to be returned.
 */
export const keysOf = <T extends object>(obj: T) => {
  return Object.keys(obj) as Array<keyof T>
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

export const getDegreeProgrammeType = async (programmeCode: string) => {
  const programmeModule = await ProgrammeModule.findOne({
    attributes: ['degreeProgrammeType'],
    where: { code: programmeCode },
  })
  return programmeModule?.degreeProgrammeType ?? null
}

export const getMinimumCreditsOfProgramme = async (programmeCode: string) => {
  const programmeModule = await ProgrammeModule.findOne({
    attributes: ['minimumCredits'],
    where: { code: programmeCode },
  })
  return programmeModule?.minimumCredits ?? null
}

export const safeJSONParse = <T>(json: string): T | null => {
  try {
    return JSON.parse(json)
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}
