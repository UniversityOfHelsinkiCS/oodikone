const { CustomPopulationSearch } = require('../models/kone')

const getCustomPopulationSearchesByUser = async userId =>
  CustomPopulationSearch.findAll({
    where: {
      userId,
    },
  })

const createCustomPopulationSearch = async (name, userId, students) =>
  CustomPopulationSearch.create({
    name,
    userId,
    students,
  })

const updateCustomPopulationSearch = async (userId, id, students) => {
  const targetCustomPopulationSearch = await CustomPopulationSearch.findOne({
    where: {
      id,
      userId,
    },
  })

  if (!targetCustomPopulationSearch) return null

  return targetCustomPopulationSearch.update({
    students,
  })
}

const deleteCustomPopulationSearch = async (userId, id) =>
  CustomPopulationSearch.destroy({
    where: {
      id,
      userId,
    },
  })

module.exports = {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch,
  deleteCustomPopulationSearch,
}
