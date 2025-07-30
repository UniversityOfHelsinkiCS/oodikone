const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'phone_number', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'phone_number')
  },
}
