const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'dissemination_info_allowed', BOOLEAN)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'dissemination_info_allowed')
  },
}
