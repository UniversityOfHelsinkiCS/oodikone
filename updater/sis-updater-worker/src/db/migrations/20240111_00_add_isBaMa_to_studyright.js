const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'is_ba_ma', BOOLEAN)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyright', 'is_ba_ma')
  },
}
