const Promise = require('bluebird')
const logger = require('../../util/logger')
const { sequelize } = require('../../database/connection')

const updateMaxAttainmentDates = async () => {
  const courseCodes = await sequelize.query('select code from course', { type: sequelize.QueryTypes.SELECT })

  await Promise.each(courseCodes, async (row) => {
    const courseCode = row.code

    try {
      const maxDate = await sequelize.query(
        'select course_code, max(attainment_date) from credit where course_code = :courseCode group by course_code',
        { replacements: { courseCode }, type: sequelize.QueryTypes.SELECT }
      )
      const maxAttainmentDate = maxDate[0].max

      await sequelize.query(
        'update course set max_attainment_date = :maxAttainmentDate where code = :courseCode',
        { replacements: { maxAttainmentDate, courseCode }, type: sequelize.QueryTypes.UPDATE }
      )
    } catch (err) {
      logger.info(`No attainments for course ${courseCode}`)
    }
  })
}

module.exports = {
  updateMaxAttainmentDates
}
