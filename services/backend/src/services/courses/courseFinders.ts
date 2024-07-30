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

// TODO: Remove horrible variable names "temp" and "cu"
export const getCoursesByNameAndOrCode = async (name: string, code: string) => {
  const rawCourses = await getRawCourses(name, code)
  const courses: CourseWithSubsId[] = rawCourses
    .map(course => ({ ...course.dataValues }))
    .sort((a, b) => getSortRank(b.code) - getSortRank(a.code))

  let substitutionGroupIndex = 0
  const visited: string[] = []

  const organizeSubgroups = (course: CourseWithSubsId) => {
    if (visited.includes(course.code)) {
      return
    }

    let temp: CourseWithSubsId[] = []
    if (course.substitutions !== null) {
      temp = courses.filter(c => course.substitutions.includes(c.code))
    }

    temp.unshift(course)
    temp.forEach(cu => {
      if (visited.includes(course.code)) {
        return
      }
      visited.push(cu.id)
      cu.subsId = substitutionGroupIndex
    })
  }

  courses.forEach(course => {
    if (!visited.includes(course.id)) {
      substitutionGroupIndex++
      organizeSubgroups(course)
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
