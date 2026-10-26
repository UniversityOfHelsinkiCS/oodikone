const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'is_custom', { type: BOOLEAN, allowNull: false, defaultValue: false })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('course', 'is_custom')
  },
}
