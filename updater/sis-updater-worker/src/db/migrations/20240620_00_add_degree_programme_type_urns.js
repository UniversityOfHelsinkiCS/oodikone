const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('element_details', 'degree_programme_type_urn', STRING)
    await queryInterface.addColumn('programme_modules', 'degree_programme_type_urn', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('element_details', 'degree_programme_type_urn', STRING)
    await queryInterface.removeColumn('programme_modules', 'degree_programme_type_urn', STRING)
  },
}
