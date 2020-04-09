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

const getTargetStudentCounts = _.memoize(
  async ({ includeOldAttainments, excludeNonEnrolled }) => {
    return await sequelize.query(
      `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
             public.is_in_target(
                 CURRENT_TIMESTAMP,
                 ss.studystartdate,
                 public.next_date_occurrence(ss.studystartdate) - INTERVAL '1 day', -- e.g if studystartdate = 2017-07-31 and it's now 2020-02-02, this returns 2020-07-31. However, if it's now 2020-11-01 (we've passed the date already), it returns 2021-07-31.
                 ss.credits,
                 CASE
                     -- HAX: instead of trying to guess which category the student is in if
                     --      the studyright is currently cancelled, just make the target HUGE
                     --      so we can subtract these from the non-goal students
                     WHEN ss.currently_cancelled = 1 THEN 999999999
                     -- credit target: 60 credits per year since starting
                     ELSE 60 * ceil(EXTRACT(EPOCH FROM (now() - ss.studystartdate) / 365) / 86400)
                 END
             )
        ) "students3y",
        SUM(
             public.is_in_target(
                 CURRENT_TIMESTAMP,
                 ss.studystartdate,
                 public.next_date_occurrence(ss.studystartdate) - INTERVAL '1 day',
                 ss.credits,
                 CASE
                     -- HAX: instead of trying to guess which category the student is in if
                     --      the studyright is currently cancelled, just make the target HUGE
                     --      so we can subtract these from the non-goal students
                     WHEN ss.currently_cancelled = 1 THEN 999999999
                     -- credit target: 45 credits per year since starting
                     ELSE 45 * ceil(EXTRACT(EPOCH FROM (now() - ss.studystartdate) / 365) / 86400)
                 END
             )
        ) "students4y",
        SUM(ss.currently_cancelled) "currentlyCancelled"
    FROM (
        SELECT
            org_code,
            org_name,
            programme_code,
            programme_name,
            studystartdate,
            studentnumber,
            SUM(credits) credits,
            CASE
                WHEN SUM(currently_cancelled) > 0 THEN 1
                ELSE 0
            END currently_cancelled
        FROM (
            SELECT
                org.code org_code,
                org.name->>'fi' org_name,
                element_details.code programme_code,
                element_details.name->>'fi' programme_name,
                studyright.studystartdate studystartdate,
                studyright.student_studentnumber studentnumber,
                credit.credits credits,
                CASE
                    WHEN studyright.canceldate IS NOT NULL AND studyright.graduated != 1 THEN 1
                    ELSE 0
                END currently_cancelled
            FROM
                organization org
                ${
                  excludeNonEnrolled
                    ? `
                -- only pick studyrights during which the student has enrolled at least once, whether it's
                -- a present or non-present enrollment
                INNER JOIN (
                  SELECT DISTINCT -- remove duplicate join rows from se with DISTINCT
                      studyright.*
                  FROM
                      studyright
                      INNER JOIN (
                          SELECT
                              studentnumber,
                              startdate
                          FROM
                              semester_enrollments
                              INNER JOIN semesters
                                  ON semester_enrollments.semestercode = semesters.semestercode
                      ) se
                          ON se.studentnumber = studyright.student_studentnumber
                  WHERE
                      se.startdate IS NOT NULL
                      AND se.startdate >= studyright.studystartdate
                ) studyright
                    ON org.code = studyright.faculty_code`
                    : `
                INNER JOIN studyright
                      ON org.code = studyright.faculty_code`
                }
                
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
                LEFT JOIN LATERAL (
                    SELECT
                        student_studentnumber,
                        attainment_date,
                        credits
                    FROM credit
                    WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                        AND credit."isStudyModule" = false
                        ${
                          includeOldAttainments
                            ? ''
                            : "AND credit.attainment_date >= studyright.studystartdate -- only include credits attained during studyright's time"
                        }
                ) credit
                    ON credit.student_studentnumber = studyright.student_studentnumber
            WHERE
                studyright.extentcode = 1 -- Bachelor's
                AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                AND studyright.studystartdate IN ('2017-07-31 21:00:00+00', '2018-07-31 21:00:00+00', '2019-07-31 21:00:00+00')
                AND element_details.type = 20 -- programme
                AND transfers.studyrightid IS NULL -- Not transferred within faculty
        ) s
        GROUP BY (1,2), (3,4), 5, 6
    ) ss
    GROUP BY (1, 2), (3, 4);
    `,
      {
        type: sequelize.QueryTypes.SELECT
      }
    )
  },
  args => JSON.stringify(args)
)

const get3yStudentsWithDrilldownPerYear = _.memoize(async startDate => {
  return await sequelize.query(
    `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
            public.is_in_target(
                CURRENT_TIMESTAMP,
                ss.studystartdate,
                next_date_occurrence(ss.studystartdate) - INTERVAL '1 day',
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
                        AND credit."isStudyModule" = false
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

const makeCheckpoints = startDate => {
  const M_TO_MS = 2.628e6 * 1000
  const FOUR_M_TO_MS = M_TO_MS * 4
  const now = Date.now()
  let checkpoints = []

  for (let ts = startDate.getTime(); ts < now; ts += FOUR_M_TO_MS) {
    checkpoints.push(new Date(ts))
  }

  if (checkpoints[checkpoints.length - 1].getTime() > now) {
    // last checkpoint in the future
    checkpoints[checkpoints.length - 1] = new Date()
  } else if (now - checkpoints[checkpoints.length - 1].getTime() > M_TO_MS) {
    // last checkpoint over a month in the past, push "now" in there
    checkpoints.push(new Date())
  }

  return checkpoints
}

const getUberData = _.memoize(
  async ({ startDate, includeOldAttainments }) => {
    const creditsTarget = targetCreditsForStartDate(startDate)
    const checkpoints = makeCheckpoints(startDate)

    return sequelize.query(
      `
    SELECT
        cp "checkpoint",
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
            public.is_in_target(
                cp,
                ss.studystartdate,
                TIMESTAMP '2020-07-31',
                ss.credits,
                $1
            )
        ) "students3y",
        SUM(
          public.is_in_target(
              cp,
              ss.studystartdate,
              TIMESTAMP '2021-07-31',
              ss.credits,
              $1
          )
      ) "students4y"
    FROM (
            SELECT
                cp,
                org_code,
                org_name,
                programme_code,
                programme_name,
                studystartdate,
                studentnumber,
                SUM(credits) credits
            FROM (
                SELECT
                    checkpoints.checkpoint cp,
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
                    INNER JOIN unnest($2::TIMESTAMP WITH TIME ZONE[])
                        AS checkpoints(checkpoint)
                        ON true
                    LEFT JOIN LATERAL (
                        SELECT
                            student_studentnumber,
                            attainment_date,
                            credits
                        FROM credit
                        WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                            AND credit."isStudyModule" = false
                            ${includeOldAttainments ? '' : 'AND credit.attainment_date >= $3::TIMESTAMP WITH TIME ZONE'}
                            AND credit.attainment_date <= checkpoints.checkpoint
                    ) credit
                        ON credit.student_studentnumber = studyright.student_studentnumber
                WHERE
                    studyright.extentcode = 1 -- Bachelor's
                    AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                    AND studyright.studystartdate = $3::TIMESTAMP WITH TIME ZONE
                    AND element_details.type = 20 -- Programme's name
                    AND transfers.studyrightid IS NULL -- Not transferred within faculty
            ) s
            GROUP BY 1, (2,3), (4,5), 6, 7
        ) ss
    GROUP BY 1, (2, 3), (4, 5);
    `,
      {
        type: sequelize.QueryTypes.SELECT,
        bind: [creditsTarget, checkpoints, startDate]
      }
    )
  },
  ({ startDate, includeOldAttainments }) => `${startDate.toISOString()}-${includeOldAttainments}`
)

const sorters = {
  target: (a, b) => a.targetStudents - b.targetStudents,
  total: (a, b) => a.totalStudents - b.totalStudents,
  targetRelative: (a, b) => a.targetStudents / a.totalStudents - b.targetStudents / b.totalStudents
}

const withErr = handler => (req, res, next) => handler(req, res, next).catch(e => res.status(500).json({ error: e }))

// mankel data from:
/* 
      [
        {
          checkpoint: "2017-11-30T13:00:00.000Z",
          orgCode: "H10",
          orgName: "Teologinen tiedekunta",
          programmeCode: "KH10_001",
          programmeName: "Teologian ja uskonnontutkimuksen kandiohjelma",
          programmeTotalStudents: "120",
          students3y: "9"
          students4y: "10"
        },
        ...
      ]
    */
// into:
/*
    {
      H10: {
        name: "Teologinen tiedekunta",
        code: "H10",
        // snapshots of faculty level total & target numbers
        snapshots: [
          {
            date: '2017-11-30T13:00:00.000Z',
            totalStudents: 340, // sum of programme total students at this checkpoint
            students3y: 43, // ^^^ of programme 3y target students
            students4y: 55
          },
          ...
        ],
        // snapshots of programme level total & target numbers, grouped by programme
        programmes: [
          {
            code: 'KH10_001',
            name: 'Teologian ja uskonnontutkimuksen kandiohjelma',
            snapshots: [
              {
                date: '2017-11-30T13:00:00.000Z',
                totalStudents: 120,
                students3y: 9,
                students4y: 10
              },
              ...
          },
          ...
        ]
      },
      ...
    }
    */
const mankeliUberData = data =>
  _(data)
    // First, gather programme snapshots grouped by programme
    .map(programmeRow => ({
      ...programmeRow,
      programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
      students3y: parseInt(programmeRow.students3y, 10),
      // 4y group includes 3y group, make the 4y group exclusive
      students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10)
    }))
    .groupBy(row => row.programmeCode)
    .map(programmeRows => ({
      ..._.pick(programmeRows[0], 'orgCode', 'orgName', 'programmeCode', 'programmeName'),
      snapshots: _(programmeRows)
        .map(({ checkpoint: date, programmeTotalStudents: totalStudents, students3y, students4y }) => ({
          date,
          totalStudents,
          students3y,
          students4y
        }))
        .sort((a, b) => a.date - b.date)
        .value()
    }))
    // Then, group all programmes under the correct organization
    .groupBy(p => p.orgCode)
    .map(programmeRows => ({
      name: programmeRows[0].orgName,
      code: programmeRows[0].orgCode,
      // Calculate snapshots for this organization by summing
      // the total & target values from each programme, grouped by the snapshot date
      snapshots: _(programmeRows)
        .flatMap(row => row.snapshots)
        .groupBy(snapshot => snapshot.date)
        .map(snapshots => ({
          date: snapshots[0].date,
          totalStudents: _.sumBy(snapshots, s => s.totalStudents),
          students3y: _.sumBy(snapshots, s => s.students3y),
          students4y: _.sumBy(snapshots, s => s.students4y)
        }))
        .sort((a, b) => a.date - b.date)
        .value(),
      /**
       * type ProgrammeCode = string
       * programmes: Map<ProgrammeCode, Programme>
       */
      programmes: _(programmeRows)
        .map(({ programmeCode: code, programmeName: name, snapshots }) => ({
          code,
          name,
          snapshots
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .value()
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .value()

router.get(
  '/uber-data',
  withErr(async (req, res) => {
    const data = await getUberData({
      startDate: new Date(req.query.start_date),
      includeOldAttainments: req.query.include_old_attainments === 'true'
    })
    const mankeld = mankeliUberData(data)
    res.json(mankeld)
  })
)

router.get(
  '/proto-c-data',
  withErr(async (req, res) => {
    const data = await getTargetStudentCounts({
      includeOldAttainments: req.query.include_old_attainments === 'true',
      excludeNonEnrolled: req.query.exclude_non_enrolled === 'true'
    })
    const mankelid = _(data)
      // seems to return the numerical columns as strings, parse them first
      .map(programmeRow => ({
        ...programmeRow,
        programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
        students3y: parseInt(programmeRow.students3y, 10),
        // 4y group includes 3y group, make 4y count exclusive:
        students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10),
        currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10)
      }))
      .groupBy(r => r.orgCode)
      .mapValues(rows => ({
        // all of these rows have the same orgCode and orgName, just pick it from the first
        code: rows[0].orgCode,
        name: rows[0].orgName,
        totalStudents: _.sumBy(rows, row => row.programmeTotalStudents),
        students3y: _.sumBy(rows, row => row.students3y),
        students4y: _.sumBy(rows, row => row.students4y),
        currentlyCancelled: _.sumBy(rows, row => row.currentlyCancelled),
        programmes: rows.map(
          ({
            programmeCode: code,
            programmeName: name,
            programmeTotalStudents: totalStudents,
            students3y,
            students4y,
            currentlyCancelled
          }) => ({
            code,
            name,
            totalStudents,
            students3y,
            students4y,
            currentlyCancelled
          })
        )
      }))
      .value()

    res.json(mankelid)
  })
)

router.get(
  '/3y-students',
  withErr(async (req, res) => {
    const { startDate, sort } = req.query
    const shouldSort = Object.keys(sorters).includes(sort)

    const rawData = await get3yStudentsWithDrilldownPerYear(startDate)
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
)

module.exports = router
