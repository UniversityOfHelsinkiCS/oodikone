module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
INSERT INTO "migrations" ("name") VALUES
('20190710_01_trunkate_migrations.js');
`, { transaction })
    })
  },
  down: async () => {
  }
}
