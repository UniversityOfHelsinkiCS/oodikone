const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('course_providers', 'composite')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('course_providers', 'composite', {
      type: STRING,
    })
  },
}
