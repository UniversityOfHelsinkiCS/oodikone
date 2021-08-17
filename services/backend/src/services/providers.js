const { Organization } = require('../modelsV2/index')

const getAllProviders = async () =>
  Organization.findAll({
    attributes: ['code', 'name'],
  })

module.exports = {
  getAllProviders,
}
