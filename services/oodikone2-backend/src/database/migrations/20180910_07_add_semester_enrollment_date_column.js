module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('semester_enrollments', 'enrollment_date', { type: Sequelize.DATE })
  },
  down: async () => {
  }
}