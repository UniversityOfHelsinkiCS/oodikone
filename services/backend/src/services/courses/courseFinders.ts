import { Op } from 'sequelize'

import { CourseWithSubsDetails } from '@oodikone/shared/types/course'
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

export const getCoursesByNameAndOrCode = async (name: string, code: string, includeSpecial: boolean) => {
  const courses = await CourseModel.findAll({
    where: {
      ...(includeSpecial ? {} : { mainCourseCode: { [Op.ne]: null } }),
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
    raw: true,
  })

  const coursesWithSubstitutionGroupDetails = await Promise.all(
    courses.map<Promise<CourseWithSubsDetails>>(async course => {
      const groupDetails = await Promise.all(
        course?.substitution_groups?.map(async group => {
          return await CourseModel.findAll({
            attributes: ['name', 'code'],
            where: { code: { [Op.in]: group } },
            raw: true,
          })
        })
      )

      return { ...course, substitution_groups: groupDetails }
    })
  )

  return coursesWithSubstitutionGroupDetails
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
