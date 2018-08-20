const { Provider } = require('../models/index')

const getAllProviders = async () => Provider.findAll({
  attributes: ['providercode', 'name']
})

module.exports = {
  getAllProviders
}