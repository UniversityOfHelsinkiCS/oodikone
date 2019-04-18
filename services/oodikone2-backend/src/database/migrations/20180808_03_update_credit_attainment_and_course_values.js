module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
        UPDATE credit
        SET 
          attainment_date = ci.coursedate,
          course_code = ci.course_code
        FROM courseinstance ci
        WHERE ci.id = credit.courseinstance_id
        ;
    `)
  },
  down: async () => {
  }
}