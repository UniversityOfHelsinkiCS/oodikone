const router = require('express').Router()
const _ = require('lodash')
const { sequelize } = require('../database/connection')

const STUDYRIGHT_START_DATE = '2017-07-31 21:00:00+00'

router.get('/start-years', async (req, res) => {
  const years = await sequelize.query(
    `
    SELECT
        DISTINCT studyright.studystartdate
    FROM organization org
        INNER JOIN studyright
            ON studyright.faculty_code = org.code
        LEFT JOIN transfers
            ON studyright.studyrightid = transfers.studyrightid
    WHERE
        studyright.extentcode = 1
        AND studyright.studystartdate >= :startDate
        AND transfers.studyrightid IS NULL
    ORDER BY 1
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { startDate: STUDYRIGHT_START_DATE }
    }
  )
  res.json(years.map(({ studystartdate }) => studystartdate))
})

const targetCreditsForStartDate = startDate => {
  const year = new Date(startDate)
  switch (year.getFullYear()) {
    case 2017:
      return 180
    case 2018:
      return 120
    case 2019:
      return 60
    default:
      throw new Error('wtf')
  }
}

const get3yStudents = _.memoize(async startDate => {
  await sequelize.query(
    `
    CREATE OR REPLACE FUNCTION pg_temp.mapRange(
        input DOUBLE PRECISION, 
        inMin DOUBLE PRECISION, 
        inMax DOUBLE PRECISION, 
        outMin DOUBLE PRECISION, 
        outMax DOUBLE PRECISION)
    RETURNS DOUBLE PRECISION AS $$
        SELECT (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    $$ LANGUAGE SQL;
  `,
    {
      type: sequelize.QueryTypes.RAW
    }
  )

  return await sequelize.query(
    `
    WITH all_students AS (
      SELECT
        org.code org_code,
        org.name->>'fi' org_name,
        studyright.student_studentnumber studentnumber,
        studyright.studystartdate studystartdate,
        credits.credits_sum credits_sum
      FROM
        organization org
        INNER JOIN studyright
          ON studyright.faculty_code = org.code
        LEFT JOIN (
          SELECT
            student_studentnumber,
            sum(credits) credits_sum
          FROM credit
          WHERE attainment_date >= :startDate
          GROUP BY student_studentnumber
        ) credits
          ON credits.student_studentnumber = studyright.student_studentnumber
        LEFT JOIN transfers
          ON studyright.studyrightid = transfers.studyrightid
      WHERE
        studyright.extentcode = 1
        AND studyright.studystartdate = :startDate
        AND transfers.studyrightid IS NULL 
    ),
    org_stats AS (
      SELECT
        all_students.org_code org_code,
        COUNT(DISTINCT all_students.studentnumber) total_students
      FROM all_students
      GROUP BY 1
    ),
    target_students AS (
      SELECT *
      FROM all_students
      WHERE
        all_students.credits_sum IS NOT NULL
        AND all_students.credits_sum >= pg_temp.mapRange(
            EXTRACT(EPOCH FROM now()),
            EXTRACT(EPOCH FROM all_students.studystartdate),
            EXTRACT(EPOCH FROM TIMESTAMP '2020-07-31'),
            0,
            1
          ) * :targetCredits
    )
    SELECT
      target_students.org_code org_code,
      target_students.org_name org_name,
      org_stats.total_students org_total_students,
      COUNT(DISTINCT target_students.studentnumber) target_students
    FROM target_students
      LEFT JOIN org_stats
        ON org_stats.org_code = target_students.org_code
    GROUP BY 1, 2, 3
    ORDER BY 2;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        startDate: startDate,
        targetCredits: targetCreditsForStartDate(startDate)
      }
    }
  )
})

router.get('/3y-students', async (req, res) => {
  const { startDate } = req.query
  const data = await get3yStudents(startDate)
  res.json(data)
})

module.exports = router
