const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'sisu_person_id', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'sisu_person_id')
  },
}
