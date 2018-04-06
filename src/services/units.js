const Sequelize = require('sequelize')
const { Unit } = require('../models')
const Op = Sequelize.Op
const all = () => {
  return Unit.findAll()
}

const findAllEnabled = () => {
  return Unit.findAll({
    where: {
      enabled: {
        [Op.eq]: true
      }
    }
  })
}

const byId = (id) => {
  return Unit.findById(id)
}

module.exports = {
  all, byId, findAllEnabled
}