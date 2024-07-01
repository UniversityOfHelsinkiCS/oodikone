const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('sis_study_right_elements', 'degree_programme_type', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('sis_study_right_elements', 'degree_programme_type')
  },
}
