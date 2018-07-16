const Sequelize = require('sequelize')
const { Filters } = require('../models')

const Op = Sequelize.Op

const findForPopulation = (pops) => Filters.findAll({
  where: {
    population: {
      [Op.eq]: pops
    }
  }
})


const createNewFilter = async (filter) => {
  return Filters.create(filter)
}
const deleteFilter = async (filter) => {
  Filters.destroy({
    where: {
      id: {
        [Op.eq]: filter.id
      }
    }
  })
  return(filter)
}
module.exports = {
  createNewFilter,
  deleteFilter,
  findForPopulation
}