const { col, fn } = require('sequelize')

const { SISStudyRightElement } = require('../models')

const getProgrammesFromStudyRights = async () => {
  const programmes = await SISStudyRightElement.findAll({
    attributes: [[fn('DISTINCT', col('code')), 'code'], 'name'],
  })
  return programmes
}

module.exports = {
  getProgrammesFromStudyRights,
}
