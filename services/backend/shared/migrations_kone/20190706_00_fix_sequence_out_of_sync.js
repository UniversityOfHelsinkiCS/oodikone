module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`SELECT setval('mandatory_courses_id_seq', (SELECT MAX(id) FROM mandatory_courses))`)
  },
  down: async () => {
  }
}
