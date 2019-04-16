const { ElementDetails } = require('../models/index')
const { Op } = require('sequelize')

const byId = id =>  ElementDetails.findById(id)

const byCodes = codes => ElementDetails.findAll({
  where: {
    code: {
      [Op.in]: codes
    }
  }
})

module.exports = { byId, byCodes }