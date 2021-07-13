const { ElementDetails } = require('../models/index')
const { Op } = require('sequelize')

const byId = id => ElementDetails.findByPk(id)

const byType = type =>
  ElementDetails.findAll({
    where: {
      type
    }
  })

const byCodes = codes =>
  ElementDetails.findAll({
    where: {
      code: {
        [Op.in]: codes
      }
    }
  })

module.exports = { byId, byType, byCodes }
