const { sequelize } = require('../database/connection')

const updateAttainmentDates = async () => {
  const { schema } = sequelize.options
  await sequelize.query(
    `UPDATE  ${schema}.course
     SET max_attainment_date = cr.max
     FROM (select course_code, max(attainment_date) from ${schema}.credit group by course_code) cr
     WHERE course.code=cr.course_code`,
    { type: sequelize.QueryTypes.UPDATE }
  )
  await sequelize.query(
    `UPDATE  ${schema}.course
     SET min_attainment_date = cr.min
     FROM (select course_code, min(attainment_date) from ${schema}.credit group by course_code) cr
     WHERE course.code=cr.course_code`,
    { type: sequelize.QueryTypes.UPDATE }
  )
}

module.exports = {
  updateAttainmentDates
}
