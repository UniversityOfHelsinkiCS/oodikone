import { Op } from 'sequelize'

import { Course } from '../../models'
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

const escapeRegExp = (string: string): string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const codeLikeTerm = (code: string) => {
  if (!code) {
    return undefined
  }
  return {
    code: {
      // Starts with code or has AY/A in front of the code (case-insensitive)
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

export const byNameAndOrCodeLike = async (name: string, code: string) => {
  const rawCourses = await getRawCourses(name, code)
  const courses = rawCourses
    .map(course => {
      return { ...course.dataValues }
    })
    .sort((x, y) => getSortRank(y.code) - getSortRank(x.code))

  let substitutionGroupIndex = 0
  const visited = []

  const organizeSubgroups = course => {
    if (visited.includes(course.code)) {
      return
    }

    let temp = []
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

export const byCodes = (codes: string[]): Promise<Course[]> => {
  return Course.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })
}
