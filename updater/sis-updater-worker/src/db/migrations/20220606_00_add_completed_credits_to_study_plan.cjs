const { INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'completed_credits', {
      type: INTEGER,
      allowNull: true,
    })
  },

  down: async queryInterface => {
    await queryInterface.deleteColumn('studyplan', 'completed_credits')
  },
}
