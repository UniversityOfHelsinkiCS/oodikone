const Sequelize = require('sequelize')
const { Roles } = require('../models')

const Op = Sequelize.Op

const byId = (id) => {
  return Roles.find({
    where: { 
      id: {
        [Op.eq]: id
      } 
    }
  })
}

const createRole = (id, role) => {
  return Roles.create({
    id: id,
    role: role
  })
}

module.exports = {
  byId, createRole
}