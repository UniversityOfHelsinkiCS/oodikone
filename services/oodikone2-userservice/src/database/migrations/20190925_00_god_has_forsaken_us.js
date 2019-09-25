// pls delet this (after 1 week, maybe?)
module.exports = {
  up: async queryInterface =>
    queryInterface.sequelize.query(
      `
      INSERT INTO migrations(name) VALUES ('20190925_01_init_db_schema.js'), ('20190925_02_populate_db.js');
      `
    ),
  down: async () => {}
}
