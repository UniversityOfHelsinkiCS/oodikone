module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('course_duplicates', { transaction })
      await queryInterface.dropTable('thesis_courses', { transaction })
    })
  },
  down: async () => {
  }
}
