const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'citizenships', {
      type: JSONB,
      defaultValue: [],
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'citizenships')
  },
}
