import { OpenUniPopulationSearchModel } from '../../models/kone'

export const getOpenUniSearchesByUser = async (userId: string) => {
  return await OpenUniPopulationSearchModel.findAll({
    where: {
      userId,
    },
  })
}

export const createOpenUniPopulationSearch = async (userId: string, name: string, courseCodes: string[]) => {
  return await OpenUniPopulationSearchModel.create({
    userId,
    name,
    courseCodes,
  })
}

export const updateOpenUniPopulationSearch = async (userId: string, id: string, courseCodes: string[]) => {
  const searchToUpdate = await OpenUniPopulationSearchModel.findOne({
    where: {
      userId,
      id,
    },
  })

  if (!searchToUpdate) {
    return null
  }

  return await searchToUpdate.update({ courseCodes })
}

export const deleteOpenUniSearch = async (userId: string, id: string) => {
  return await OpenUniPopulationSearchModel.destroy({
    where: {
      userId,
      id,
    },
  })
}
