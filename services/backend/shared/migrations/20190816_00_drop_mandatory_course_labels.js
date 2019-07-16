module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('mandatory_course_labels', { transaction })
    })
  },
  down: async () => {
  }
}