const { DOUBLE, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.changeColumn('studyplan', 'completed_credits', {
      type: DOUBLE,
    })
  },
  down: async queryInterface => {
    await queryInterface.changeColumn('studyplan', 'completed_credits', {
      type: INTEGER,
    })
  },
}
