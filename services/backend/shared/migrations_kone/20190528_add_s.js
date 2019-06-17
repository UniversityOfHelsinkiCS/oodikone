module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Sequelize.transaction(async transaction => {
      await queryInterface.renameTable('teacher_course_group', 'teacher_course_groups', { transaction })
    })
  },

  down: async () => {
  }
}
