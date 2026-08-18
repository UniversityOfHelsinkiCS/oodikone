import { CustomPopulationSearchModel } from '../models/kone'

export const getCustomPopulationSearchesByUser = async (userId: string) => {
  return CustomPopulationSearchModel.findAll({
    where: {
      userId,
    },
  })
}

export const createCustomPopulationSearch = async (
  name: string,
  userId: string,
  mode: 'studentNumbers' | 'programmes',
  students: string[],
  programmes: { code: string; name: string }[],
  year: string
) => {
  return CustomPopulationSearchModel.create({
    name,
    userId,
    mode,
    students: mode === 'studentNumbers' ? students : [],
    programmes: mode === 'programmes' ? programmes : [],
    year: mode === 'programmes' ? year : null,
  })
}

export const updateCustomPopulationSearch = async (
  userId: string,
  id: string,
  mode: 'studentNumbers' | 'programmes',
  students: string[],
  programmes: { code: string; name: string }[],
  year: string
) => {
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
    mode,
    students: mode === 'studentNumbers' ? students : [],
    programmes: mode === 'programmes' ? programmes : [],
    year: mode === 'programmes' ? year : null,
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
