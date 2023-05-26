const _ = require('lodash')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { mapToProviders } = require('../../util/utils')
const { ElementDetail, Organization } = require('../../models')
const { getRedisCDS, saveToRedis } = require('./shared')
const { facultiesAndProgrammesForTrends } = require('../../services/organisations')

const REDIS_KEY_STATUS = 'STATUS_DATA_V5'

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
            replacements: { a: new Date(unixMillis) },
          }
        )
      )[0].startdate
    )
)

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const getOrganizationStudents = async (start, end) => {
  const rows = await sequelize.query(
    `
    SELECT
      sre.code AS code,
      ARRAY_AGG(DISTINCT(sr.student_studentnumber)) AS students
    FROM studyright sr
    INNER JOIN studyright_elements sre ON sre.studyrightid = sr.studyrightid
    INNER JOIN element_details ed ON ed.code = sre.code
    WHERE ed.type = 20 AND (:start, :end) OVERLAPS (sr.startdate, sr.enddate)
    GROUP BY sre.code
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { start, end },
    }
  )

  const codes = mapToProviders(rows.map(({ code }) => code))

  const orgIdRows = await sequelize.query(
    `
    SELECT o.code, o.id FROM organization o WHERE o.code IN (:codes)
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { codes },
    }
  )

  const orgIds = Object.fromEntries(orgIdRows.map(({ code, id }) => [code, id]))

  return rows.reduce((acc, { code, students }) => {
    const [orgCode] = mapToProviders([code])
    const orgId = orgIds[orgCode]
    acc[orgId] = students
    return acc
  }, {})
}

const getOrganizationCredits = async (start, end) => {
  const rows = await sequelize.query(
    `
    SELECT
      cp.organizationcode AS code,
      -- ARRAY_AGG(DISTINCT(cr.student_studentnumber)) AS students,
      SUM(cr.credits) AS credits
    FROM credit cr
    INNER JOIN course co ON co.code = cr.course_code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    WHERE
      cr.attainment_date BETWEEN :start AND :end AND
      cr.credittypecode IN (4, 9) AND
      (cr."isStudyModule" = FALSE OR cr."isStudyModule" IS NULL)
    GROUP BY cp.organizationcode
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { start, end },
    }
  )

  return rows.reduce((acc, { code, credits }) => {
    acc[code] = credits
    return acc
  }, {})
}

const getOrganizationStatistics = async (organizations, start, end) => {
  const orgCredits = await getOrganizationCredits(start, end)
  const orgStudents = await getOrganizationStudents(start, end)

  const organizationStats = {}

  let stack_pointer = 0
  const stack = ['hy-university-root-id']

  while (stack_pointer < stack.length) {
    const orgId = stack[stack_pointer]
    stack_pointer += 1

    organizations.filter(({ parent_id }) => parent_id === orgId).forEach(({ id }) => stack.push(id))
  }

  const updateOrgStats = (orgId, stats, isDirect) => {
    if (organizationStats[orgId] === undefined) {
      organizationStats[orgId] = {
        direct: { credits: 0, students: new Set() },
        aggregated: { credits: 0, students: new Set() },
      }
    }

    const orgStats = organizationStats[orgId]

    const statsRefs = isDirect ? [orgStats.direct, orgStats.aggregated] : [orgStats.aggregated]

    statsRefs.forEach(statsRef => {
      statsRef.credits += stats.credits
      stats.students.forEach(s => statsRef.students.add(s))
    })
  }

  while (stack.length > 0) {
    const orgId = stack.pop()
    const credits = orgCredits[orgId] ?? 0
    const students = orgStudents[orgId] ?? []

    const org = organizations.find(({ id }) => id === orgId)
    const parentOrgId = org.parent_id

    updateOrgStats(orgId, { credits, students }, true)

    if (parentOrgId) {
      updateOrgStats(parentOrgId, organizationStats[orgId].aggregated, false)
    }
  }

  return Object.entries(organizationStats).reduce((acc, [id, { direct, aggregated }]) => {
    acc[id] = {
      id,
      direct: {
        students: direct.students.size,
        credits: direct.credits,
      },
      aggregated: {
        students: aggregated.students.size,
        credits: aggregated.credits,
      },
    }

    return acc
  }, {})
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
      replacements: { a, b },
    }
  )
}

const getTotalOpenUniCreditsOfCoursesBetween = async (a, b, alias = 'sum', alias2 = 'sum2') => {
  return sequelize.query(
    `
    SELECT SUM(cr.credits) AS ${alias}, COUNT(DISTINCT(cr.student_studentnumber)) AS ${alias2},
    o.code AS organizationcode, co.code, co.id, co.name
    FROM credit cr
    INNER JOIN course co ON cr.course_code = co.code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    INNER JOIN organization o ON o.id = cp.organizationcode
    AND cr.attainment_date BETWEEN :a AND :b
    AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
    AND cr.credittypecode IN (4, 9) 
    AND cr.is_open = true
    AND cr.student_studentnumber NOT IN
        (
        SELECT student_studentnumber FROM studyright_elements
        WHERE studyright_elements.studentnumber = cr.student_studentnumber
        AND cr.attainment_date BETWEEN studyright_elements.startdate AND studyright_elements.enddate
      )
    GROUP BY co.id, o.code -- HAVING SUM(cr.credits) > 0
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { a, b },
    }
  )
}

const makeYearlyCreditsPromises = (currentYear, years, getRange, alias = 'sum', alias2 = 'sum2', avoin) => {
  return years.map(
    year =>
      new Promise(async res => {
        const diff = currentYear - year
        const { from, to } = getRange(diff)
        const creditsByCourse = avoin
          ? await getTotalOpenUniCreditsOfCoursesBetween(from, to, alias, alias2)
          : await getTotalCreditsOfCoursesBetween(from, to, alias, alias2)
        res(
          creditsByCourse.map(c => {
            c['year'] = year
            return c
          })
        )
      })
  )
}

const getOrgStats = (stats, orgId) =>
  stats[orgId] ?? {
    accumulated: {
      aggregated: { students: 0, credits: 0 },
      direct: { students: 0, credits: 0 },
    },
    total: {
      aggregated: { students: 0, credits: 0 },
      direct: { students: 0, credits: 0 },
    },
  }

const getOrgsOfOpenUniReqularCounterparts = async codes => {
  const rows = await sequelize.query(
    `
      SELECT co.id, co.code, cp.organizationcode, org.code AS organization
      FROM course co, course_providers cp, organization org
      WHERE co.code IN(:codes)
      AND co.id = cp.coursecode
      AND org.id = cp.organizationcode;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { codes },
    }
  )

  return rows.reduce((acc, { code, organization }) => {
    acc[code] = organization
    return acc
  }, {})
}

const calculateStatusStatistics = async (unixMillis, showByYear) => {
  const YEAR_TO_MILLISECONDS = 31556952000
  /* Memoize parses booleans into strings... */
  const startDate = showByYear === 'true' ? getCurrentYearStartDate() : await getCurrentStudyYearStartDate(unixMillis)
  const startYear = startDate.getFullYear()
  const startTime = startDate.getTime()
  const yearRange = _.range(2017, startYear + 1)
  const getRangeAcc = diff => ({
    from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
    to:
      showByYear === 'true'
        ? new Date(startTime - (diff - 1) * YEAR_TO_MILLISECONDS)
        : new Date(unixMillis - diff * YEAR_TO_MILLISECONDS),
  })
  const getRangeTotal = diff => ({
    from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
    to: new Date(startTime - (diff - 1) * YEAR_TO_MILLISECONDS),
  })

  const yearlyAccCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange,
    getRangeAcc,
    'acc',
    'students',
    false
  )
  const yearlyOpenUniAccCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange,
    getRangeAcc,
    'acc',
    'students',
    true
  )
  const yearlyTotalCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange.slice(0, -1),
    getRangeTotal,
    'total',
    'students',
    false
  )

  const yearlyOpenUniTotalCreditsPromises = makeYearlyCreditsPromises(
    startYear,
    yearRange.slice(0, -1),
    getRangeTotal,
    'total',
    'students',
    true
  )

  /* Gather all required data */
  const [
    yearlyAccCredits,
    yearlyTotalCredits,
    yearlyOpenUniAccCredits,
    yearlyOpenUniTotalCredits,
    elementDetails,
    faculties,
  ] = await Promise.all([
    Promise.all(yearlyAccCreditsPromises),
    Promise.all(yearlyTotalCreditsPromises),
    Promise.all(yearlyOpenUniAccCreditsPromises),
    Promise.all(yearlyOpenUniTotalCreditsPromises),
    ElementDetail.findAll(),
    Organization.findAll(),
  ])

  const isOpenUniCourseCode = code => code.match(/^AY?(.+?)(?:en|fi|sv)?$/)

  const unifyOpenUniversity = code => {
    const regexresult = isOpenUniCourseCode(code)
    if (!regexresult) return code
    return regexresult[1]
  }

  const fromAyToNormalCourses = [
    ...new Set(_.flatten(yearlyOpenUniAccCredits).map(c => unifyOpenUniversity(c.code))),
    ...new Set(_.flatten(yearlyOpenUniTotalCredits).map(c => unifyOpenUniversity(c.code))),
  ]

  const orgsOfOpenUniReqularCounterparts = await getOrgsOfOpenUniReqularCounterparts(fromAyToNormalCourses)

  const facultyProgrammes = facultiesAndProgrammesForTrends

  const yearlyOrgStatPromises = yearRange.map(async year => {
    const accumulatedStats = await getOrganizationStatistics(
      faculties,
      new Date(startTime - (startYear - year) * YEAR_TO_MILLISECONDS),
      showByYear === 'true'
        ? new Date(startTime - (startYear - year - 1) * YEAR_TO_MILLISECONDS)
        : new Date(unixMillis - (startYear - year) * YEAR_TO_MILLISECONDS)
    )

    const totalStats =
      year !== startYear &&
      (await getOrganizationStatistics(
        faculties,
        new Date(startTime - (startYear - year) * YEAR_TO_MILLISECONDS),
        new Date(startTime - (startYear - year - 1) * YEAR_TO_MILLISECONDS)
      ))

    return [
      year,
      _.merge(
        _.mapValues(totalStats, total => ({ total })),
        _.mapValues(accumulatedStats, accumulated => ({ accumulated }))
      ),
    ]
  })

  const orgStats = await Promise.all(yearlyOrgStatPromises)

  const yearlyOrgStats = Object.fromEntries(orgStats)
  const [[, currentOrgStats], [, prevOrgStats]] = orgStats.reverse()

  const defaultYearStats = _.chain(_.range(2017, startYear + 1))
    .map(year => [year, { acc: 0, accStudents: 0 }])
    .fromPairs()
    .value()

  const getOrgYearlyStats = orgId =>
    _.chain(yearlyOrgStats)
      .mapValues(stats => {
        const orgStats = getOrgStats(stats, orgId)

        return {
          acc: orgStats.accumulated.aggregated.credits,
          accStudents: orgStats.accumulated.aggregated.students,
          total: orgStats.total?.aggregated?.credits,
          totalStudents: orgStats.total?.aggregated?.students,
        }
      })
      .defaults(defaultYearStats)
      .value()

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

  programmeToFaculties['H906'] = ['H906']

  const providerToProgramme = elementDetails.reduce((res, curr) => {
    const [p] = mapToProviders([curr.code])
    res[p] = {
      code: curr.code,
      name: curr.name,
    }
    return res
  }, {})

  providerToProgramme['H906'] = {
    code: 'H906',
    name: { en: 'Language Centre', fi: 'Kielikeskus', sv: 'Språkcentrum' },
  }

  providerToProgramme['H930'] = {
    code: 'H930',
    name: { en: 'Open University', fi: 'Avoin yliopisto', sv: 'Öppna universitetet' },
  }

  const organizationCodeToOrganization = faculties.reduce((acc, org) => {
    acc[org.code] = org
    return acc
  }, {})

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

  const refactoredOpenUniCredits = [..._.flatten(yearlyOpenUniAccCredits), ..._.flatten(yearlyOpenUniTotalCredits)].map(
    ele => {
      const org = orgsOfOpenUniReqularCounterparts[unifyOpenUniversity(ele.code)]
      return {
        ...ele,
        organizationcode: org ? org : 'H930',
      }
    }
  )

  /* Calculate course level stats and group by providers */
  const coursesGroupedByProvider = Object.entries(
    _.groupBy([..._.flatten(yearlyAccCredits), ..._.flatten(yearlyTotalCredits)], 'organizationcode')
  ).reduce((acc, [organizationcode, courseCredits]) => {
    acc[organizationcode] = Object.entries(_.groupBy(courseCredits, 'code')).reduce(
      (acc, [courseCode, yearlyInstances]) => {
        acc[courseCode] = {
          yearly: {},
          name: yearlyInstances[0].name,
          type: 'course',
          code: courseCode,
        }

        const array = _.range(2017, startYear + 1)

        array.forEach(year => {
          acc[courseCode]['yearly'][year] = {}
          acc[courseCode]['yearly'][year]['acc'] = 0
          acc[courseCode]['yearly'][year]['accStudents'] = 0
          acc[courseCode]['yearly'][year]['total'] = undefined
          acc[courseCode]['yearly'][year]['totalStudents'] = undefined
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

  const openUniCoursesGroupedByProvider = Object.entries(
    _.groupBy(refactoredOpenUniCredits, 'organizationcode')
  ).reduce((acc, [organizationcode, courseCredits]) => {
    acc[organizationcode] = Object.entries(_.groupBy(courseCredits, 'code')).reduce(
      (acc, [courseCode, yearlyInstances]) => {
        acc[courseCode] = {
          yearly: {},
          name: yearlyInstances[0].name,
          type: 'course',
          code: courseCode,
        }

        const array = _.range(2017, startYear + 1)

        array.forEach(year => {
          acc[courseCode]['yearly'][year] = {}
          acc[courseCode]['yearly'][year]['acc'] = 0
          acc[courseCode]['yearly'][year]['accStudents'] = 0
          acc[courseCode]['yearly'][year]['total'] = undefined
          acc[courseCode]['yearly'][year]['totalStudents'] = undefined
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

    if (programme && programme.code) {
      if (programme.code === 'H906') {
        const courseValues = Object.values(courses)
        const yearlyValues = courseValues.map(c => c.yearly)

        acc[programme.code] = {
          type: 'programme',
          code: programme.code,
          name: programme.name,
          drill: courses,
          yearly: _.mergeWith({}, ...yearlyValues, mergele),
          current: _.sumBy(courseValues, 'current') | undefined,
          previous: _.sumBy(courseValues, 'previous') | undefined,
          currentStudents: _.sumBy(courseValues, 'currentStudents') || 'undefined',
          previousStudents: _.sumBy(courseValues, 'previousStudents') | 'undefined',
        }

        return acc
      }

      const orgId = organizationCodeToOrganization[organizationcode]?.id

      const { students: currentStudents, credits: current } = getOrgStats(currentOrgStats, orgId).accumulated.aggregated
      const { students: previousStudents, credits: previous } = getOrgStats(prevOrgStats, orgId).accumulated.aggregated

      const yearly = getOrgYearlyStats(orgId)

      acc[programme.code] = {
        type: 'programme',
        code: programme.code,
        name: programme.name,
        drill: courses,
        yearly,
        current,
        previous,
        currentStudents: currentStudents,
        previousStudents: previousStudents,
      }
    }

    return acc
  }, {})

  const openUniGroupedByProgramme = Object.entries(openUniCoursesGroupedByProvider).reduce(
    (acc, [organizationcode, courses]) => {
      const programme = providerToProgramme[organizationcode]

      if (programme && programme.code) {
        const courseValues = Object.values(courses)
        const yearlyValues = courseValues.map(c => c.yearly)

        acc[programme.code] = {
          type: 'programme',
          code: programme.code,
          name: programme.name,
          drill: courses,
          yearly: _.mergeWith({}, ...yearlyValues, mergele),
          current: _.sumBy(courseValues, 'current') | undefined,
          previous: _.sumBy(courseValues, 'previous') | undefined,
          currentStudents: _.sumBy(courseValues, 'currentStudents') || 'undefined',
          previousStudents: _.sumBy(courseValues, 'previousStudents') | 'undefined',
        }

        return acc
      }

      return acc
    },
    {}
  )

  /* Group programmes into faculties and calculate faculty level stats */
  const groupedByFaculty = Object.entries(groupedByProgramme).reduce((acc, [programmeCode, programmeStats]) => {
    const facultyCodes = programmeToFaculties[programmeCode]
    if (!facultyCodes) return acc
    facultyCodes.forEach(facultyCode => {
      if (!facultyCode) return
      if (facultyCode === 'H906' || facultyCode === 'H930') {
        if (!acc[facultyCode]) {
          acc[facultyCode] = {
            type: 'faculty',
            code: facultyCode,
            drill: {},
            name: facultyCodeToFaculty[facultyCode] ? facultyCodeToFaculty[facultyCode].name : null,
            yearly: programmeStats.yearly,
            current: programmeStats.current,
            previous: programmeStats.previous,
            currentStudents: programmeStats.currentStudents,
            previousStudents: programmeStats.previousStudents,
          }
        }
      }

      if (!acc[facultyCode]) {
        const orgId = organizationCodeToOrganization[facultyCode].id

        const { students: currentStudents, credits: current } = getOrgStats(currentOrgStats, orgId).accumulated
          .aggregated
        const { students: previousStudents, credits: previous } = getOrgStats(prevOrgStats, orgId).accumulated
          .aggregated

        const yearly = getOrgYearlyStats(orgId)

        acc[facultyCode] = {
          type: 'faculty',
          code: facultyCode,
          drill: {},
          name: facultyCodeToFaculty[facultyCode] ? facultyCodeToFaculty[facultyCode].name : null,
          yearly,
          current,
          previous,
          currentStudents,
          previousStudents,
        }
      }

      acc[facultyCode]['drill'][programmeCode] = programmeStats
    })
    return acc
  }, {})

  const openUniGroupedByFaculty = Object.entries(openUniGroupedByProgramme).reduce(
    (acc, [programmeCode, programmeStats]) => {
      const facultyCode = 'H930'

      if (!acc[facultyCode]) {
        acc[facultyCode] = {
          type: 'faculty',
          code: facultyCode,
          drill: {},
          name: facultyCodeToFaculty[facultyCode] ? facultyCodeToFaculty[facultyCode].name : null,
          yearly: {},
          current: 0,
          previous: 0,
        }
      }

      acc[facultyCode]['drill'][programmeCode] = programmeStats
      acc[facultyCode]['yearly'] = _.mergeWith(acc[facultyCode]['yearly'], programmeStats.yearly, mergele)
      acc[facultyCode]['current'] += programmeStats.current
      acc[facultyCode]['previous'] += programmeStats.previous
      return acc
    },
    {}
  )
  return { ...groupedByFaculty, ...openUniGroupedByFaculty }
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
  refreshStatus,
}
