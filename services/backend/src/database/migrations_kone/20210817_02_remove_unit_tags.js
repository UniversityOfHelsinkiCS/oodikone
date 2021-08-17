module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('unit_tag')
  },
  down: async () => {},
}
