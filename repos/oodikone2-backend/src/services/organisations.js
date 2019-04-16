const Sequelize = require('sequelize')
const { Organisation } = require('../models')
const Op = Sequelize.Op

const byCode = (code) => {
  return Organisation.findOne({
    where: {
      code: {
        [Op.eq]: code
      }
    },
  })
}

const all = () => {
  return Organisation.findAll()
}

module.exports = {
  byCode, all
}