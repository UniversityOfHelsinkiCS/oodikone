module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('programme_module_children')
    await queryInterface.dropTable('programme_modules')
  },
  down: async () => {},
}
