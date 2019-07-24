const { sequelize } = require('../database/connection')

const updateAttainmentDates = async () => {
  const { schema } = sequelize.options
  const transaction = await sequelize.transaction()
  try {
    await sequelize.query(
      `UPDATE  ${schema}.course
     SET max_attainment_date = cr.max
     FROM (select course_code, max(attainment_date) from ${schema}.credit group by course_code) cr
     WHERE course.code=cr.course_code`,
      { type: sequelize.QueryTypes.UPDATE, transaction, lock: transaction.LOCK.UPDATE }
    )
    await sequelize.query(
      `UPDATE  ${schema}.course
     SET min_attainment_date = cr.min
     FROM (select course_code, min(attainment_date) from ${schema}.credit group by course_code) cr
     WHERE course.code=cr.course_code`,
      { type: sequelize.QueryTypes.UPDATE, transaction, lock: transaction.LOCK.UPDATE }
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
