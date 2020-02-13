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
    
    -- linear mapping from 0-180op -> 0-1 * targetCredits basically
    CREATE OR REPLACE FUNCTION pg_temp.is_in_target(
        currentDate TIMESTAMP WITH TIME ZONE,
        studyStartDate TIMESTAMP WITH TIME ZONE,
        targetDate TIMESTAMP WITH TIME ZONE,
        studentCredits DOUBLE PRECISION,
        targetCredits DOUBLE PRECISION)
    RETURNS INTEGER AS $$
        SELECT CASE WHEN studentCredits >= pg_temp.mapRange(
            EXTRACT(EPOCH FROM currentDate),
            EXTRACT(EPOCH FROM studyStartDate),
            EXTRACT(EPOCH FROM targetDate),
            0,
            targetCredits
        )
            THEN 1
            ELSE 0
        END;
    $$ LANGUAGE SQL;`,
    {
      type: sequelize.QueryTypes.RAW,
      multipleStatements: true
    }
  )
  return await sequelize.query(
    `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
            pg_temp.is_in_target(
                CURRENT_TIMESTAMP,
                ss.studystartdate,
                TIMESTAMP '2020-07-31',
                ss.credits,
                :targetCredits
            )
        ) "targetStudents"
    FROM (
        SELECT
            org_code,
            org_name,
            programme_code,
            programme_name,
            studystartdate,
            studentnumber,
            SUM(credits) credits
        FROM (
            SELECT
                org.code org_code,
                org.name->>'fi' org_name,
                element_details.code programme_code,
                element_details.name->>'fi' programme_name,
                studyright.studystartdate studystartdate,
                studyright.student_studentnumber studentnumber,
                credit.credits credits
            FROM
                organization org
                INNER JOIN studyright
                    ON org.code = studyright.faculty_code
                INNER JOIN (
                    -- HACK: fix updater writing duplicates where enddate has changed
                    SELECT DISTINCT ON (studyrightid, startdate, code, studentnumber)
                        *
                    FROM studyright_elements
                ) s_elements
                    ON studyright.studyrightid = s_elements.studyrightid
                INNER JOIN element_details
                    ON s_elements.code = element_details.code
                LEFT JOIN transfers
                    ON studyright.studyrightid = transfers.studyrightid
                LEFT JOIN (
                    SELECT
                        student_studentnumber,
                        attainment_date,
                        credits
                    FROM credit
                    WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                        AND credit.attainment_date >= :startDate
                ) credit
                    ON credit.student_studentnumber = studyright.student_studentnumber
            WHERE
                studyright.extentcode = 1 -- Bachelor's
                AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                AND studyright.studystartdate = :startDate
                AND element_details.type = 20 -- Programme's name
                AND transfers.studyrightid IS NULL -- Not transferred within faculty
        ) s
        GROUP BY (1,2), (3,4), 5, 6
    ) ss
    GROUP BY (1, 2), (3, 4);
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
