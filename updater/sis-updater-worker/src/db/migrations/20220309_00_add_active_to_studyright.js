const { INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'active', {
      type: INTEGER,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('studyright', 'active')
  },
}
