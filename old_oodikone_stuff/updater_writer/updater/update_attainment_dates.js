const { sequelize } = require('../database/connection')

const updateAttainmentDates = async () => {
  const { schema } = sequelize.options
  const transaction = await sequelize.transaction()
  try {
    await sequelize.query(
      `
      -- Block writing to table to avoid deadlocks:
      LOCK TABLE ONLY ${schema}.course IN EXCLUSIVE MODE;

      UPDATE  ${schema}.course
      SET max_attainment_date = cr.max, min_attainment_date = cr.min
      FROM (select course_code, max(attainment_date), min(attainment_date) from ${schema}.credit group by course_code) cr
      WHERE course.code=cr.course_code;
     `,
      { transaction }
    )
    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    throw e
  }
}

module.exports = {
  updateAttainmentDates
}
