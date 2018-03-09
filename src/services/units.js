const { Unit } = require('../models')

const all = () => {
  return Unit.findAll()
}

const byId = (id) => {
  return Unit.findById(id)
}

module.exports = {
  all, byId
}