const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'degree_programme_type', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('programme_modules', 'degree_programme_type')
  },
}
