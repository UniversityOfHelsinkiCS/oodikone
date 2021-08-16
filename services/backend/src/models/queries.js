const { sequelize } = require('../database/connection')

const getStudentNumbers = () =>
  sequelize.query(
    `select
      studentnumber
      from student
      order by studentnumber desc`,
    { type: sequelize.QueryTypes.SELECT }
  )

module.exports = {
  getStudentNumbers,
}
