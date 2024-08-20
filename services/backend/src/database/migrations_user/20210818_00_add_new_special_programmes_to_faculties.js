module.exports = {
  up: async ({ context: queryInterface }) =>
    queryInterface.sequelize.query(`
      --- Some lääkis special programmes
      INSERT INTO faculty_programmes VALUES ('H30', '447000', 'NOW()', 'NOW()');
      INSERT INTO faculty_programmes VALUES ('H30', '447001', 'NOW()', 'NOW()');
      INSERT INTO faculty_programmes VALUES ('H30', '447002', 'NOW()', 'NOW()');
      --- Some kasvis special programmes
      INSERT INTO faculty_programmes VALUES ('H60', 'EDUK730', 'NOW()', 'NOW()');
      INSERT INTO faculty_programmes VALUES ('H60', 'K-MUUT-ERIL', 'NOW()', 'NOW()');
    `),
  down: async () => {},
}
