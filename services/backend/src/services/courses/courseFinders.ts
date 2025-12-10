import { orderBy } from 'lodash'
import { Op } from 'sequelize'

import { CourseWithSubsId } from '@oodikone/shared/types/course'
import { CourseModel } from '../../models'

const nameLikeTerm = (name: string) => {
  if (!name) {
    return undefined
  }
  const term = `%${name.trim()}%`
  return {
    name: {
      [Op.or]: {
        fi: {
          [Op.iLike]: term,
        },
        sv: {
          [Op.iLike]: term,
        },
        en: {
          [Op.iLike]: term,
        },
      },
    },
  }
}

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const codeLikeTerm = (code: string) => {
  if (!code) {
    return undefined
  }
  return {
    code: {
      [Op.iRegexp]: `^(AY|A)?${escapeRegExp(code)}`,
    },
  }
}

const getRawCourses = async (name: string, code: string, includeSpecial = false) =>
  await CourseModel.findAll({
    where: {
      ...(includeSpecial ? {} : { mainCourseCode: { [Op.ne]: null } }),
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
  })

const getCourses = async (name: string, code: string) => {
  const rawCourses = await getRawCourses(name, code)
  return rawCourses.map(course => ({
    ...course.toJSON(),
    substitutions: orderBy(course.substitutions, [
      substitution => {
        if (/^A/.exec(substitution)) return 4 // open university codes come last
        if (/^\d/.exec(substitution)) return 2 // old numeric codes come second
        if (/^[A-Za-z]/.exec(substitution)) return 1 // new letter based codes come first
        return 3 // unknown, comes before open uni?
      },
    ]),
  })) as CourseWithSubsId[]
}

export const getCoursesByNameAndOrCode = async (name: string, code: string) => {
  const courses = await getCourses(name, code)

  let substitutionGroupIndex = 0
  const visitedCourses = new Set<string>()

  const assignSubstitutionGroup = (course: CourseWithSubsId) => {
    if (visitedCourses.has(course.code)) {
      return
    }

    const relatedCourses = courses.filter(currentCourse => course.substitutions.includes(currentCourse.code))
    relatedCourses.unshift(course)
    relatedCourses.forEach(relatedCourse => {
      if (visitedCourses.has(relatedCourse.id)) {
        return
      }
      visitedCourses.add(relatedCourse.id)
      relatedCourse.subsId = substitutionGroupIndex
    })
  }

  courses.forEach(course => {
    if (!visitedCourses.has(course.id)) {
      substitutionGroupIndex++
      assignSubstitutionGroup(course)
    }
  })

  return courses
}

export const getCoursesByCodes = (codes: string[]) => {
  return CourseModel.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })
}
