module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('credit', 'courseinstance_id')
  },
  down: async () => {
  }
}