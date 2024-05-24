module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('user_accessgroup')
  },
  down: async () => {},
}
