const { Unit } = require('../models')

const all = () => {
  return Unit.findAll()
}

const findAllEnabled = () => {
  return Unit.findAll({
    where: { enabled: true }
  })
}

const byId = (id) => {
  return Unit.findById(id)
}

module.exports = {
  all, byId, findAllEnabled
}