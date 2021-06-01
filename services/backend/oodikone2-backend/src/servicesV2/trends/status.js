const _ = require('lodash')
const { ElementDetail, Organization } = require('../../modelsV2')
const {
  dbConnections: { sequelize }
} = require('../../databaseV2/connection')
const { mapToProviders } = require('../../util/utils')
const { getRedisCDS, saveToRedis, userServiceClient } = require('./shared')

const REDIS_KEY_STATUS = 'STATUS_DATA_V2'

const getCurrentStudyYearStartDate = _.memoize(
  async unixMillis =>
    new Date(
      (
        await sequelize.query(
          `
    SELECT startdate FROM SEMESTERS s WHERE yearcode = (SELECT yearcode FROM SEMESTERS WHERE startdate < :a ORDER BY startdate DESC LIMIT 1) ORDER BY startdate LIMIT 1;
    `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { a: new Date(unixMillis) }
          }
        )
      )[0].startdate
    )
)

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const getTotalCreditsOfCoursesBetween = async (a, b, alias = 'sum', alias2 = 'sum2') => {
  return sequelize.query(
    `
    SELECT SUM(cr.credits) AS ` +
    alias + // HAX, alias doesn't come from user so no sql injection
      `,COUNT(DISTINCT(cr.student_studentnumber)) AS ` +
      alias2 +
      `, o.code AS organizationcode, co.code, co.id, co.name FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      INNER JOIN course_providers cp ON cp.coursecode = co.id
      INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE
      cr.attainment_date BETWEEN :a AND :b
      AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
      AND cr.credittypecode IN (4, 9)
    GROUP BY co.id, o.code
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

const makeYearlyCreditsPromises = (currentYear, years, getRange, alias = 'sum', alias2 = 'sum2') => {
  return years.map(
    year =>
      new Promise(async res => {
        const diff = currentYear - year
        const { from, to } = getRange(diff)
        const creditsByCourse = await getTotalCreditsOfCoursesBetween(from, to, alias, alias2)
        res(
          creditsByCourse.map(c => {
            c['year'] = year
            return c
          })
        )
      })
  )
}

const calculateStatusStatistics = async (unixMillis, showByYear) => {
  const YEAR_TO_MILLISECONDS = 31556952000
  /* Memoize parses booleans into strings... */
  const startDate = showByYear === 'true' ? getCurrentYearStartDate() : await getCurrentStudyYearStartDate(unixMillis)
  const startYear = startDate.getFullYear()
  const startTime = startDate.getTime()
  const yearRange = _.range(2017, startYear + 1)
  const yearlyAccCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange,
    diff => ({
      from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
      to: new Date(unixMillis - diff * YEAR_TO_MILLISECONDS)
    }),
    'acc',
    'students'
  )

  const yearlyTotalCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange.slice(0, -1),
    diff => ({
      from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
      to: new Date(startTime - (diff - 1) * YEAR_TO_MILLISECONDS)
    }),
    'total',
    'students'
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
    ElementDetail.findAll(),
    Organization.findAll(),
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
    _.groupBy([..._.flatten(yearlyAccCredits), ..._.flatten(yearlyTotalCredits)], 'organizationcode')
  ).reduce((acc, [organizationcode, courseCredits]) => {
    acc[organizationcode] = Object.entries(_.groupBy(courseCredits, 'code')).reduce(
      (acc, [courseCode, yearlyInstances]) => {
        acc[courseCode] = { yearly: {}, name: yearlyInstances[0].name }
        const array = [2020, 2019, 2018, 2017]
        array.forEach(year => {
          acc[courseCode]['yearly'][year] = {}
          acc[courseCode]['yearly'][year]['acc'] = 0
          acc[courseCode]['yearly'][year]['accStudents'] = 0
          acc[courseCode]['yearly'][year]['total'] = 0
          acc[courseCode]['yearly'][year]['totalStudents'] = 0
        })
        yearlyInstances.forEach(instance => {
          if (!acc[courseCode]['yearly'][instance.year]) acc[courseCode]['yearly'][instance.year] = {}

          if (instance.acc !== undefined) {
            acc[courseCode]['yearly'][instance.year]['acc'] = instance.acc
            acc[courseCode]['yearly'][instance.year]['accStudents'] = Number(instance.students)
          } else {
            acc[courseCode]['yearly'][instance.year]['total'] = instance.total
            acc[courseCode]['yearly'][instance.year]['totalStudents'] = Number(instance.students)
          }
        })
        acc[courseCode]['current'] = _.get(acc, [courseCode, 'yearly', startYear, 'acc']) || 0
        acc[courseCode]['previous'] = _.get(acc, [courseCode, 'yearly', startYear - 1, 'acc']) || 0
        acc[courseCode]['currentStudents'] = _.get(acc, [courseCode, 'yearly', startYear, 'accStudents']) || 0
        acc[courseCode]['previousStudents'] = _.get(acc, [courseCode, 'yearly', startYear - 1, 'accStudents']) || 0
        return acc
      },
      {}
    )
    return acc
  }, {})

  /* Map providers into proper programmes and calculate programme level stats */
  const groupedByProgramme = Object.entries(coursesGroupedByProvider).reduce((acc, [organizationcode, courses]) => {
    const programme = providerToProgramme[organizationcode]
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
}

const getStatus = async (unixMillis, showByYear, doRefresh = false) => {
  // redis keys for different queries. adds a new key for every queried day.
  // might cause issues, might not but def not until I am out :D

  const KEY = `${REDIS_KEY_STATUS}_DATE_${unixMillis}_YEARLY_${showByYear.toUpperCase()}`
  const status = await getRedisCDS(KEY)
  if (!status || doRefresh) {
    const data = await calculateStatusStatistics(unixMillis, showByYear)
    await saveToRedis(data, KEY, true)
    return data
  }
  return status
}

const refreshStatus = async (unixMillis, showByYear) => {
  const KEY = `${REDIS_KEY_STATUS}_DATE_${unixMillis}_YEARLY_${showByYear.toUpperCase()}`
  const data = await calculateStatusStatistics(unixMillis, showByYear)
  await saveToRedis(data, KEY, true)
}

module.exports = {
  getStatus,
  refreshStatus
}
