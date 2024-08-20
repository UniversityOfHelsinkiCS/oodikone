const { STRING } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('users', 'sisu_person_id', STRING)
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('users', 'sisu_person_id')
  },
}
