const Sequelize = require('sequelize')
const { Organization } = require('../modelsV2')
const Op = Sequelize.Op

// Have facultyfetching to work like it worked during oodi-db time
const facultiesInOodi = [
  'H10',
  'H20',
  'H30',
  'H40',
  'H50',
  'H55',
  'H57',
  'H60',
  'H70',
  'H74',
  'H80',
  'H90',
  'H92',
  'H930',
  'H99',
  'Y',
  'Y01',
]

const faculties = () => {
  return Organization.findAll({
    where: {
      code: {
        [Op.in]: facultiesInOodi,
      },
    },
  })
}

module.exports = {
  faculties,
}
