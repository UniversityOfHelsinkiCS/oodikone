const { Organization } = require('../models')

const getAllProviders = async () =>
  Organization.findAll({
    attributes: ['code', 'name'],
  })

module.exports = {
  getAllProviders,
}
