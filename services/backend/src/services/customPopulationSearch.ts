import { CustomPopulationSearchModel } from '../models/kone'

export const getCustomPopulationSearchesByUser = async (userId: string) => {
  return CustomPopulationSearchModel.findAll({
    where: {
      userId,
    },
  })
}

export const createCustomPopulationSearch = async (name: string, userId: string, students: string[]) => {
  return CustomPopulationSearchModel.create({
    name,
    userId,
    students,
  })
}

export const updateCustomPopulationSearch = async (userId: string, id: string, students: string[]) => {
  const targetCustomPopulationSearch = await CustomPopulationSearchModel.findOne({
    where: {
      id,
      userId,
    },
  })

  if (!targetCustomPopulationSearch) {
    return null
  }

  return targetCustomPopulationSearch.update({
    students,
  })
}

export const deleteCustomPopulationSearch = async (userId: string, id: string) => {
  return CustomPopulationSearchModel.destroy({
    where: {
      id,
      userId,
    },
  })
}
