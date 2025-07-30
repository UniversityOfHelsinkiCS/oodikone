const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'abbreviatedname', STRING)
  },
  down: async () => {},
}
