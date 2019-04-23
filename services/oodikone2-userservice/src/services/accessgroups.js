const { AccessGroup } = require('../models/index')
const { Op } = require('sequelize')

const byId = id =>  AccessGroup.findByPk(id)

const findAll = () => AccessGroup.findAll()

const byCodes = codes => AccessGroup.findAll({
  where: {
    group_code: {
      [Op.in]: codes
    }
  }
})

module.exports = { byId, byCodes, findAll }