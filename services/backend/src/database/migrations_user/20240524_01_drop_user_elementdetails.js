module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('user_elementdetails')
  },
  down: async () => {},
}
