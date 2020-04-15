const axios = require('axios')
const router = require('express').Router()
const _ = require('lodash')
const { ElementDetails, Organisation } = require('../models')
const { sequelize } = require('../database/connection')
const { mapToProviders } = require('../util/utils')
const { USERSERVICE_URL } = require('../conf-backend')
const userServiceClient = axios.create({
  baseURL: USERSERVICE_URL,
  headers: { secret: process.env.USERSERVICE_SECRET }
})

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
                 public.next_date_occurrence(ss.studystartdate), -- e.g if studystartdate = 2017-07-31 and it's now 2020-02-02, this returns 2020-07-31. However, if it's now 2020-11-01 (we've passed the date already), it returns 2021-07-31.
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
                 public.next_date_occurrence(ss.studystartdate),
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
                next_date_occurrence(ss.studystartdate),
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

const isSameDateIgnoringYear = (a, b) =>
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate() &&
  a.getUTCHours() === b.getUTCHours() &&
  a.getUTCMinutes() === b.getUTCMinutes() &&
  a.getUTCSeconds() === b.getUTCSeconds() &&
  a.getUTCMilliseconds() === b.getUTCMilliseconds()

const makeCheckpoints = startDate => {
  const M_TO_MS = 2.628e6 * 1000
  const FOUR_M_TO_MS = M_TO_MS * 4
  const CHECKPOINT_INTERVAL = FOUR_M_TO_MS

  const now = Date.now()
  let checkpoints = []

  // add start date as first checkpoint but add 1ms since just having the same date
  // would set the credit target to 0
  checkpoints.push(new Date(startDate.getTime() + 1))

  for (let ts = startDate.getTime() + CHECKPOINT_INTERVAL; ts < now; ts += CHECKPOINT_INTERVAL) {
    checkpoints.push(new Date(ts))
  }

  if (checkpoints[checkpoints.length - 1].getTime() > now) {
    // last checkpoint in the future
    checkpoints[checkpoints.length - 1] = new Date()
  } else if (now - checkpoints[checkpoints.length - 1].getTime() > M_TO_MS) {
    // last checkpoint over a month in the past, push "now" in there
    checkpoints.push(new Date())
  }

  // go through all checkpoints excluding first and adjust the ones that are exactly one
  // year from start date
  // do this here in the end so we don't need to copypaste isSameDateIgnoringYear
  // in three places
  for (let i = 1; i < checkpoints.length; i++) {
    if (isSameDateIgnoringYear(startDate, checkpoints[i])) {
      // exactly one year from start date -> set checkpoint to 1ms before so we don't explode in SQL
      checkpoints[i] = new Date(checkpoints[i].getTime() - 1)
    }
  }

  return checkpoints
}

const getUberData = _.memoize(
  async ({ startDate, includeOldAttainments }) => {
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
                  public.next_date_occurrence(ss.studystartdate, cp),
                  ss.credits,
                  60 * ceil(EXTRACT(EPOCH FROM (cp - ss.studystartdate) / 365) / 86400)
              )
          ) "students3y",
          SUM(
              public.is_in_target(
                  cp,
                  ss.studystartdate,
                  public.next_date_occurrence(ss.studystartdate, cp),
                  ss.credits,
                  45 * ceil(EXTRACT(EPOCH FROM (cp - ss.studystartdate) / 365) / 86400)
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
                  INNER JOIN unnest($1::TIMESTAMP WITH TIME ZONE[])
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
                          ${includeOldAttainments ? '' : 'AND credit.attainment_date >= $2::TIMESTAMP WITH TIME ZONE'}
                          AND credit.attainment_date <= checkpoints.checkpoint
                  ) credit
                      ON credit.student_studentnumber = studyright.student_studentnumber
              WHERE
                  studyright.extentcode = 1 -- Bachelor's
                  AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                  AND studyright.studystartdate = $2::TIMESTAMP WITH TIME ZONE
                  AND element_details.type = 20 -- Programme's name
                  AND transfers.studyrightid IS NULL -- Not transferred within faculty
          ) s
          GROUP BY 1, (2,3), (4,5), 6, 7
      ) ss
      GROUP BY 1, (2, 3), (4, 5);
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        bind: [checkpoints, startDate]
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

const withErr = handler => (req, res, next) =>
  handler(req, res, next).catch(e => {
    console.error(e)
    res.status(500).json({ error: { message: e.message, stack: e.stack } })
  })

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

const getCurrentStudyYearStartDate = async () =>
  new Date(
    (await sequelize.query(
      `
    SELECT startdate FROM SEMESTERS s WHERE yearcode = (SELECT yearcode FROM SEMESTERS WHERE startdate < NOW() ORDER BY startdate DESC LIMIT 1) ORDER BY startdate LIMIT 1;
    `,
      {
        type: sequelize.QueryTypes.SELECT
      }
    ))[0].startdate
  )

const getTotalCreditsOfCoursesBetween = async (a, b) => {
  return sequelize.query(
    `
    SELECT SUM(cr.credits), cp.providercode, co.code, co.name FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      INNER JOIN course_providers cp ON cp.coursecode = co.code
    WHERE
      cr.attainment_date BETWEEN :a AND :b
      AND cr."isStudyModule" = false
      AND cr.credittypecode IN (4, 9)
    GROUP BY co.code, cp.providercode
    -- HAVING SUM(cr.credits) > 0
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { a, b }
    }
  )
}

const mergele = (a, b) => {
  if (!a) return b
  if (!b) return a
  return a + b
}

const getStatusStatistics = _.memoize(async () => {
  const Y_TO_MS = 31556952000
  const now = new Date()
  const currentAcademicYearStartDate = await getCurrentStudyYearStartDate()
  const currentAcademicYearStartYear = currentAcademicYearStartDate.getFullYear()

  const yearRange = _.range(2017, currentAcademicYearStartYear + 1)
  const yearlyCreditsPromises = yearRange.map(
    year =>
      new Promise(async res => {
        const diff = currentAcademicYearStartYear - year
        const creditsByCourse = await getTotalCreditsOfCoursesBetween(
          new Date(currentAcademicYearStartDate.getTime() - diff * Y_TO_MS),
          new Date(now.getTime() - diff * Y_TO_MS)
        )
        res(
          creditsByCourse.map(c => {
            c['year'] = year
            return c
          })
        )
      })
  )

  const [yearlyCredits, elementDetails, faculties, { data: facultyProgrammes }] = await Promise.all([
    Promise.all(yearlyCreditsPromises),
    ElementDetails.findAll(),
    Organisation.findAll(),
    userServiceClient.get('/faculty_programmes')
  ])

  const facultyCodeToFaculty = faculties.reduce((res, curr) => {
    res[curr.code] = curr
    return res
  }, {})

  const programmeToFaculty = facultyProgrammes.reduce((res, curr) => {
    res[curr.programme_code] = curr.faculty_code
    return res
  }, {})

  const providerToProgramme = elementDetails.reduce((res, curr) => {
    const [p] = mapToProviders([curr.code])
    res[p] = {
      code: curr.code,
      name: curr.name
    }
    return res
  }, {})

  const coursesGroupedByProvider = Object.entries(_.groupBy([..._.flatten(yearlyCredits)], 'providercode')).reduce(
    (acc, [providerCode, courseCredits]) => {
      acc[providerCode] = Object.entries(_.groupBy(courseCredits, 'code')).reduce(
        (acc, [courseCode, yearlyInstances]) => {
          acc[courseCode] = { yearly: {}, name: yearlyInstances[0].name }
          yearlyInstances.forEach(instance => {
            acc[courseCode]['yearly'][instance.year] = instance.sum
          })
          acc[courseCode]['current'] = acc[courseCode]['yearly'][currentAcademicYearStartYear] || 0
          acc[courseCode]['previous'] = acc[courseCode]['yearly'][currentAcademicYearStartYear - 1] || 0
          return acc
        },
        {}
      )
      return acc
    },
    {}
  )

  const groupedByProgramme = Object.entries(coursesGroupedByProvider).reduce((acc, [providerCode, courses]) => {
    const programme = providerToProgramme[providerCode]
    const courseValues = Object.values(courses)
    const yearlyValues = courseValues.map(c => c.yearly)

    if (programme && programme.code) {
      acc[programme.code] = {
        name: programme.name,
        drill: courses,
        yearly: _.mergeWith({}, ...yearlyValues, mergele),
        current: _.sumBy(courseValues, 'current'),
        previous: _.sumBy(courseValues, 'previous')
      }
    }
    return acc
  }, {})

  const groupedByFaculty = Object.entries(groupedByProgramme).reduce((acc, [programmeCode, programmeStats]) => {
    const facultyCode = programmeToFaculty[programmeCode]
    if (!facultyCode) return acc
    if (!acc[facultyCode]) {
      acc[facultyCode] = {
        drill: {},
        name: facultyCodeToFaculty[facultyCode] ? facultyCodeToFaculty[facultyCode].name : null,
        yearly: {},
        current: 0,
        previous: 0
      }
    }
    acc[facultyCode]['drill'][programmeCode] = programmeStats
    acc[facultyCode]['yearly'] = _.mergeWith(acc[facultyCode]['yearly'], programmeStats.yearly, mergele)
    acc[facultyCode]['current'] += programmeStats.current
    acc[facultyCode]['previous'] += programmeStats.previous
    return acc
  }, {})

  return groupedByFaculty
})

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

router.get(
  '/status',
  withErr(async (req, res) => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const status = await getStatusStatistics(startOfToday.getTime()) // Memoizing by day
    res.json(status)
  })
)

module.exports = router
