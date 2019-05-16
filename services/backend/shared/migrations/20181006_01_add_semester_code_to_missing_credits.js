module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.query(`
    UPDATE credit
    SET 
      semestercode = semesters.semestercode
    FROM semesters
    WHERE credit.semestercode is null
      AND credit.attainment_date BETWEEN semesters.startdate AND semesters.enddate
    ;
`)
  },
  down: () => {
  }
}