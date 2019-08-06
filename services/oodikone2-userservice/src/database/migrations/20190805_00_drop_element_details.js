module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint('faculty_programmes', 'faculty_programmes_programme_code_fkey', { transaction })
      await queryInterface.removeConstraint('user_elementdetails', 'user_elementdetails_elementDetailCode_fkey', { transaction })
      await queryInterface.dropTable('element_details', { transaction })
    })
  },
  down: async () => {
  }
}
