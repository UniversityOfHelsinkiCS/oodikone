const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'substitution_groups', {
      type: JSONB,
      AllowNull: true,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('course', 'substitution_groups')
  },
}
