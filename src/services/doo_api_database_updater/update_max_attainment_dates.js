const { sequelize } = require('../../database/connection')

const updateMaxAttainmentDates = async () => {
  await sequelize.query(
    `UPDATE course
     SET max_attainment_date = cr.max
     FROM (select course_code, max(attainment_date) from credit group by course_code) cr
     WHERE course.code=cr.course_code`,
    { type: sequelize.QueryTypes.UPDATE }
  )
}

module.exports = {
  updateMaxAttainmentDates
}
