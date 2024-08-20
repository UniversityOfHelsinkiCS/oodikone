module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('programme_module_children')
    await queryInterface.dropTable('programme_modules')
  },
  down: async () => {},
}
