import { Op } from 'sequelize'

import { CourseModel, OrganizationModel } from '../models'

export const getAllProviders = async () => {
  const providers = OrganizationModel.findAll({
    raw: true,
    attributes: ['code', 'name'],
  })
  return providers
}

export const getCourseIdsOfProvider = async (provider: string): Promise<string[]> => {
  const coursesByProvider = await CourseModel.findAll({
    raw: true,
    attributes: ['id', 'substitutionGroups'],
    include: {
      model: OrganizationModel,
      required: true,
      where: {
        code: provider,
      },
      through: {
        attributes: [],
      },
    },
  })

  const directIds = coursesByProvider.map(({ id }) => id)
  const substitutionGroupIds = [
    ...new Set(coursesByProvider.flatMap(({ substitutionGroups }) => substitutionGroups ?? []).flat()),
  ]

  if (substitutionGroupIds.length === 0) return directIds

  const substitutionCourses = await CourseModel.findAll({
    raw: true,
    attributes: ['id'],
    where: { groupId: { [Op.in]: substitutionGroupIds } },
    include: {
      model: OrganizationModel,
      required: true,
      where: {
        code: provider,
      },
      through: {
        attributes: [],
      },
    },
  })

  return [...new Set([...directIds, ...substitutionCourses.map(({ id }) => id)])]
}
