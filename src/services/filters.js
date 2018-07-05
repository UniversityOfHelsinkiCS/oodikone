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
module.exports = {
  createNewFilter,
  findForPopulation
}