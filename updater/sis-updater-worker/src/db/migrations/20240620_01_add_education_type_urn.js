const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('element_details', 'education_type', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('element_details', 'education_type', STRING)
  },
}
