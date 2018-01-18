const Sequelize = require('sequelize')
const { Organisation } = require('../models')
const Op = Sequelize.Op

const createOrganisation = (array) => {
  return Organisation.create({
    code: array.code,
    name: array.name
  })
}

const byCode = (code) => {
  return Organisation.findOne({
    where: {
      code: {
        [Op.eq]: code
      }
    },
  })
}

module.exports = {
  createOrganisation, byCode
}