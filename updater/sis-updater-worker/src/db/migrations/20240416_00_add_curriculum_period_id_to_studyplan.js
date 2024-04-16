const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'curriculum_period_id', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'curriculum_period_id')
  },
}
