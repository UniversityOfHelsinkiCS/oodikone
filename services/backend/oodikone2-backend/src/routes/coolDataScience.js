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

const get3yStudentsWithDrilldown = _.memoize(async startDate => {
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
            element_details.name->>'fi' programme_name,
            studyright.student_studentnumber studentnumber,
            studyright.studystartdate studystartdate,
            credits.credits_sum credits_sum
        FROM
            organization org
            INNER JOIN studyright
                ON studyright.faculty_code = org.code
            LEFT JOIN studyright_elements
                ON studyright.studyrightid = studyright_elements.studyrightid
            LEFT JOIN element_details
                ON element_details.code = studyright_elements.code
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
            AND element_details.type = 20
            AND studyright.studystartdate = :startDate
            AND transfers.studyrightid IS NULL
    ),
    org_stats AS (
        SELECT
            all_students.org_code org_code,
            all_students.programme_name programme_name,
            COUNT(DISTINCT all_students.studentnumber) total_students
        FROM all_students
        GROUP BY 1, 2
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
        target_students.org_code "orgCode",
        target_students.org_name "orgName",
        target_students.programme_name "programmeName",
        org_stats.total_students "programmeTotalStudents",
        COUNT(DISTINCT target_students.studentnumber) "targetStudents"
    FROM target_students
        LEFT JOIN org_stats
            ON org_stats.org_code = target_students.org_code
                AND org_stats.programme_name = target_students.programme_name
    GROUP BY 1, 2, 3, 4
    ORDER BY 2
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

const sorters = {
  target: (a, b) => a.targetStudents - b.targetStudents,
  total: (a, b) => a.totalStudents - b.totalStudents
}

router.get('/3y-students', async (req, res) => {
  const { startDate, sort } = req.query
  const shouldSort = Object.keys(sorters).includes(sort)

  const rawData = await get3yStudentsWithDrilldown(startDate)
  const byOrganization = rawData.reduce((acc, val) => {
    const programmeTotalStudents = parseInt(val.programmeTotalStudents, 10)
    const targetStudents = parseInt(val.targetStudents, 10)

    const obj = acc[val.orgCode] || {}
    obj.code = val.orgCode
    obj.name = val.orgName
    obj.programmes = obj.programmes || []
    obj.programmes.push({
      name: val.programmeName,
      totalStudents: programmeTotalStudents,
      targetStudents: targetStudents
    })
    obj.totalStudents = (obj.totalStudents || 0) + programmeTotalStudents
    obj.targetStudents = (obj.targetStudents || 0) + targetStudents
    acc[val.orgCode] = obj
    return acc
  }, {})

  const data = Object.values(byOrganization)
  res.json(
    shouldSort ? data.map(d => ({ ...d, programmes: d.programmes.sort(sorters[sort]) })).sort(sorters[sort]) : data
  )
})

module.exports = router
