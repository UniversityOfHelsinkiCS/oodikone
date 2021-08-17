module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('user_unit')
  },
  down: async () => {},
}
