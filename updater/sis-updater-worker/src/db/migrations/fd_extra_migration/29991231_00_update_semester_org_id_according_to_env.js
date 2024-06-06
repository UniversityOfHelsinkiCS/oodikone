const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'jeeeeeeeeeeeeeeeeeee', STRING)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'jeeeeeeeeeeeeeeeeeee')
  },
}
