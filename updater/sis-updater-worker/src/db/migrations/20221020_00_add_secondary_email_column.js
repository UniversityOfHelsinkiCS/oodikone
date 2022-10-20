const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'secondary_email', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'secondary_email')
  },
}
