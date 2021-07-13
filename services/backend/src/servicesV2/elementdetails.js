const { ElementDetail } = require('../modelsV2/index')
const { Op } = require('sequelize')

const byId = id => ElementDetail.findByPk(id)

const byType = type =>
  ElementDetail.findAll({
    where: {
      type,
    },
  })

const byCodes = codes =>
  ElementDetail.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })

module.exports = { byId, byType, byCodes }
