module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('users', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('user_elementdetails', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('user_unit', {
      force: true,
      cascade: false,
    })
    
  },
  down: async () => {
  }
}