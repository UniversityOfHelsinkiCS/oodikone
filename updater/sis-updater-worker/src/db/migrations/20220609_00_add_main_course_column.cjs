const { TEXT } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'main_course_code', TEXT)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('course', 'main_course_code')
  },
}
