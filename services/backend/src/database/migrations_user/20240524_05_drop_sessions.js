module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('"Sessions"')
  },
  down: async () => {},
}
