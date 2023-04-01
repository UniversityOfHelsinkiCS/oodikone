const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'sisu_id', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'sisu_id')
  },
}
