const { STRING } = require('sequelize')

// Migration step 1 of 2
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('excluded_courses', 'course_group_id', {
      type: STRING,
    })
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('excluded_courses', 'course_group_id')
  },
}
