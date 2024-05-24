module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('user_faculties')
  },
  down: async () => {},
}
