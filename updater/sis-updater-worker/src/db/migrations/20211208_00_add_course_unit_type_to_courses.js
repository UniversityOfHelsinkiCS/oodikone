const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'course_unit_type', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('course', 'course_unit_type')
  },
}
