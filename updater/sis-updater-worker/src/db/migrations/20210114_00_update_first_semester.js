module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(
      `
      UPDATE semesters
      SET startdate = '1900-08-01'
      WHERE composite = 'hy-university-root-id-1'
      `
    )
  },

  down: async queryInterface => {
    await queryInterface.sequelize.query(
      `
      UPDATE semesters
      SET startdate = '1950-08-01'
      WHERE composite = 'hy-university-root-id-1'
      `
    )
  },
}
