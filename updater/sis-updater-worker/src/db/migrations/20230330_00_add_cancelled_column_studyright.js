const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'cancelled', BOOLEAN)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyright', 'cancelled')
  },
}
