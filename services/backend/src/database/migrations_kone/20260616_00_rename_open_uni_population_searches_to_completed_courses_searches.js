module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.renameTable('open_uni_population_searches', 'completed_courses_searches')
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.renameTable('completed_courses_searches', 'open_uni_population_searches')
  },
}
