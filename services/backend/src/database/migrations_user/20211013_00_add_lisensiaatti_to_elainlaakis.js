module.exports = {
  up: async ({ context: queryInterface }) =>
    queryInterface.sequelize.query(`
      --- add lisensiaatti to lääkis faculty
      INSERT INTO faculty_programmes VALUES ('H90', 'MH90_001', 'NOW()', 'NOW()');
    `),
  down: async () => {},
}
