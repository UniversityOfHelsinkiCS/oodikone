import { CustomPopulationSearch } from '../models/kone'

export const getCustomPopulationSearchesByUser = async (userId: bigint) => {
  return CustomPopulationSearch.findAll({
    where: {
      userId,
    },
  })
}

export const createCustomPopulationSearch = async (name: string, userId: bigint, students: string[]) => {
  return CustomPopulationSearch.create({
    name,
    userId,
    students,
  })
}

export const updateCustomPopulationSearch = async (userId: bigint, id: bigint, students: string[]) => {
  const targetCustomPopulationSearch = await CustomPopulationSearch.findOne({
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

export const deleteCustomPopulationSearch = async (userId: bigint, id: bigint) => {
  return CustomPopulationSearch.destroy({
    where: {
      id,
      userId,
    },
  })
}
