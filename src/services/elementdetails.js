const { ElementDetails } = require('../models/index')

const byId = id =>  ElementDetails.findById(id)

module.exports = { byId }