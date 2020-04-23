const axios = require('axios')
const _ = require('lodash')
const { ElementDetails, Organisation } = require('../models')
const { sequelize } = require('../database/connection')
const { mapToProviders } = require('../util/utils')
const { USERSERVICE_URL } = require('../conf-backend')
const userServiceClient = axios.create({
  baseURL: USERSERVICE_URL,
  headers: { secret: process.env.USERSERVICE_SECRET }
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
  async ({ codes, includeOldAttainments, excludeNonEnrolled }) => {
    return await sequelize.query(
      `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        ss.programme_type "programmeType",
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
            programme_type,
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
                element_details.type programme_type,
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
                AND element_details.type IN (20,30) -- programme
                ${!!codes && codes.length > 0 ? 'AND element_details.code IN (:codes)' : ''}
                AND transfers.studyrightid IS NULL -- Not transferred within faculty
        ) s
        GROUP BY (1,2), (3,4) ,5 , 6, 7
    ) ss
    GROUP BY (1, 2), (3, 4), 5;
    `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          codes: codes
        }
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

const getCurrentStudyYearStartDate = _.memoize(
  async unixMillis =>
    new Date(
      (await sequelize.query(
        `
    SELECT startdate FROM SEMESTERS s WHERE yearcode = (SELECT yearcode FROM SEMESTERS WHERE startdate < :a ORDER BY startdate DESC LIMIT 1) ORDER BY startdate LIMIT 1;
    `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { a: new Date(unixMillis) }
        }
      ))[0].startdate
    )
)

const getTotalCreditsOfCoursesBetween = async (a, b, alias = 'sum') => {
  return sequelize.query(
    `
    SELECT SUM(cr.credits) AS ` +
    alias + // HAX, alias doesn't come from user so no sql injection
      `, cp.providercode, co.code, co.name FROM credit cr
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

const sumMerge = (a, b) => {
  if (!a) return b
  if (!b) return a
  return a + b
}

const mergele = (a, b) => {
  if (!a) return _.clone(b)
  if (!b) return _.clone(a)
  return _.mergeWith(a, b, sumMerge)
}

const makeYearlyCreditsPromises = (currentYear, years, getRange, alias = 'sum') => {
  return years.map(
    year =>
      new Promise(async res => {
        const diff = currentYear - year
        const { from, to } = getRange(diff)
        const creditsByCourse = await getTotalCreditsOfCoursesBetween(from, to, alias)
        res(
          creditsByCourse.map(c => {
            c['year'] = year
            return c
          })
        )
      })
  )
}

const getStatusStatistics = _.memoize(async unixMillis => {
  const Y_TO_MS = 31556952000
  const currentAcademicYearStartDate = await getCurrentStudyYearStartDate(unixMillis)
  const currentAcademicYearStartYear = currentAcademicYearStartDate.getFullYear()
  const currentAcademicYearStartTime = currentAcademicYearStartDate.getTime()

  const yearRange = _.range(2017, currentAcademicYearStartYear + 1)
  const yearlyAccCreditsPromises = makeYearlyCreditsPromises(
    currentAcademicYearStartYear,
    yearRange,
    diff => ({
      from: new Date(currentAcademicYearStartTime - diff * Y_TO_MS),
      to: new Date(unixMillis - diff * Y_TO_MS)
    }),
    'acc'
  )

  const yearlyTotalCreditsPromises = makeYearlyCreditsPromises(
    currentAcademicYearStartYear,
    yearRange.slice(0, -1),
    diff => ({
      from: new Date(currentAcademicYearStartTime - diff * Y_TO_MS),
      to: new Date(currentAcademicYearStartTime - (diff - 1) * Y_TO_MS)
    }),
    'total'
  )

  /* Gather all required data */
  const [
    yearlyAccCredits,
    yearlyTotalCredits,
    elementDetails,
    faculties,
    { data: facultyProgrammes }
  ] = await Promise.all([
    Promise.all(yearlyAccCreditsPromises),
    Promise.all(yearlyTotalCreditsPromises),
    ElementDetails.findAll(),
    Organisation.findAll(),
    userServiceClient.get('/faculty_programmes')
  ])

  /* Construct some helper maps */
  const facultyCodeToFaculty = faculties.reduce((res, curr) => {
    res[curr.code] = curr
    return res
  }, {})

  const programmeToFaculties = facultyProgrammes.reduce((res, curr) => {
    if (!res[curr.programme_code]) res[curr.programme_code] = []
    res[curr.programme_code].push(curr.faculty_code)
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

  /* Calculate course level stats and group by providers */
  const coursesGroupedByProvider = Object.entries(
    _.groupBy([..._.flatten(yearlyAccCredits), ..._.flatten(yearlyTotalCredits)], 'providercode')
  ).reduce((acc, [providerCode, courseCredits]) => {
    acc[providerCode] = Object.entries(_.groupBy(courseCredits, 'code')).reduce(
      (acc, [courseCode, yearlyInstances]) => {
        acc[courseCode] = { yearly: {}, name: yearlyInstances[0].name }
        yearlyInstances.forEach(instance => {
          if (!acc[courseCode]['yearly'][instance.year]) acc[courseCode]['yearly'][instance.year] = {}
          if (instance.acc !== undefined) {
            acc[courseCode]['yearly'][instance.year]['acc'] = instance.acc
          } else {
            acc[courseCode]['yearly'][instance.year]['total'] = instance.total
          }
        })
        acc[courseCode]['current'] = _.get(acc, [courseCode, 'yearly', currentAcademicYearStartYear, 'acc']) || 0
        acc[courseCode]['previous'] = _.get(acc, [courseCode, 'yearly', currentAcademicYearStartYear - 1, 'acc']) || 0
        return acc
      },
      {}
    )
    return acc
  }, {})

  /* Map providers into proper programmes and calculate programme level stats */
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

  /* Group programmes into faculties and calculate faculty level stats */
  const groupedByFaculty = Object.entries(groupedByProgramme).reduce((acc, [programmeCode, programmeStats]) => {
    const facultyCodes = programmeToFaculties[programmeCode]
    if (!facultyCodes) return acc
    facultyCodes.forEach(facultyCode => {
      if (!facultyCode) return
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
    })
    return acc
  }, {})

  return groupedByFaculty
})

module.exports = {
  withErr,
  mankeliUberData,
  getTargetStudentCounts,
  get3yStudentsWithDrilldownPerYear,
  getStatusStatistics,
  getUberData,
  sorters
}
