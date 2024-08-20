module.exports = {
  up: async ({ context: queryInterface }) =>
    queryInterface.sequelize.query(`
    --- Some kasvis special programmes
    INSERT INTO faculty_programmes VALUES ('H60', 'ED400', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED200', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED700', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED100', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED300', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED600', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8009', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8118', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8600', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'DUK-PED', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '65', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '1102', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '20018', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8601', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '9290', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8172', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '83600', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'DUM-PED', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', 'ED500', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '83601', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '0130', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '20005-e', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '1040', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '8703', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '0005', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '7900', 'NOW()', 'NOW()');
    INSERT INTO faculty_programmes VALUES ('H60', '0152 ', 'NOW()', 'NOW()');
    `),
  down: async () => {},
}
