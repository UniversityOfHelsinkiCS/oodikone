import { Op } from 'sequelize'

import { Name, Unification } from '@oodikone/shared/types'
import { CourseModel } from '../../models'

export type FormattedProgramme = {
  code: string
  name: Name
  startDate?: Date
  facultyCode: string
  organization: OrganizationDetails
}

export const getIsOpen = (unification: Unification) => {
  const options: Record<Unification, object> = {
    open: { [Op.eq]: true },
    regular: { [Op.eq]: false },
    unify: { [Op.ne]: null },
  }
  return options[unification]
}

export type OrganizationDetails = {
  code?: string
  name: Name
}

/** Gets all course ids for a course given course groupId(s) */
export const getAllCourseIds = async (groupIds: string | string[]) =>
  (
    await CourseModel.findAll({
      attributes: ['id'],
      where: { groupId: { [Op.in]: Array.isArray(groupIds) ? groupIds : [groupIds] } },
      raw: true,
    })
  ).map(course => course.id)
