const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'semester_enrollments', JSONB)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyright', 'semester_enrollments')
  },
}
