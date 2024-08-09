import { Op } from 'sequelize'

import { Course } from '../../models'
import { CourseWithSubsId } from '../../types'
import { getSortRank } from '../../util/sortRank'

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

const getRawCourses = async (name: string, code: string) => {
  return await Course.findAll({
    where: {
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
    order: [['id', 'desc']],
  })
}

const getCourses = async (name: string, code: string) => {
  const rawCourses = await getRawCourses(name, code)
  const courses: CourseWithSubsId[] = rawCourses
    .map(course => ({ ...course.dataValues }))
    .sort((a, b) => getSortRank(b.code) - getSortRank(a.code))
  return courses
}

export const getCoursesByNameAndOrCode = async (name: string, code: string) => {
  const courses = await getCourses(name, code)
  let substitutionGroupIndex = 0
  const visitedCourses: string[] = []

  const assignSubstitutionGroup = (course: CourseWithSubsId) => {
    if (visitedCourses.includes(course.code)) {
      return
    }
    let relatedCourses: CourseWithSubsId[] = []
    if (course.substitutions !== null) {
      relatedCourses = courses.filter(currentCourse => course.substitutions.includes(currentCourse.code))
    }
    relatedCourses.unshift(course)
    relatedCourses.forEach(relatedCourse => {
      if (visitedCourses.includes(relatedCourse.id)) {
        return
      }
      visitedCourses.push(relatedCourse.id)
      relatedCourse.subsId = substitutionGroupIndex
    })
  }

  courses.forEach(course => {
    if (!visitedCourses.includes(course.id)) {
      substitutionGroupIndex++
      assignSubstitutionGroup(course)
    }
  })

  return { courses }
}

export const getCoursesByCodes = (codes: string[]) => {
  return Course.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })
}
