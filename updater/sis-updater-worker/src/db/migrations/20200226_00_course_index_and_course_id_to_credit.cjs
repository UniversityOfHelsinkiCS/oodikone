const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeConstraint('credit', 'credit_course_code_fkey')
    await queryInterface.addColumn('credit', 'course_id', {
      type: STRING,
      references: {
        model: 'course',
        key: 'id',
      },
    })
    await queryInterface.addIndex('course', ['code'])
  },
  down: async () => {},
}
