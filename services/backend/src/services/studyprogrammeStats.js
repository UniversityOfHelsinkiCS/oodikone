const moment = require('moment')
const { indexOf } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  getYearsObject,
  getYearsArray,
  getMedian,
  getMean,
  getStartDate,
  getThesisType,
} = require('./studyprogrammeHelpers')
const {
  graduatedStudyRights,
  startedStudyrights,
  cancelledStudyRights,
  transfersAway,
  transfersTo,
  getProgrammesStudents,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
} = require('./newStudyprogramme')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { getYearStartAndEndDates } = require('../util/semester')

const getStartedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })
      const studyrights = await startedStudyrights(studyprogramme, since, studentnumbersOfTheYear)

      studyrights.forEach(({ studystartdate }) => {
        const startYear = defineYear(studystartdate, isAcademicYear)
        graphStats[indexOf(years, startYear)] += 1
        tableStats[startYear] += 1
      })
    })
  )
  return { graphStats, tableStats }
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })

      const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbersOfTheYear)
      studyrights.forEach(({ enddate }) => {
        const graduationYear = defineYear(enddate, isAcademicYear)
        graphStats[indexOf(years, graduationYear)] += 1
        tableStats[graduationYear] += 1
      })
    })
  )
  return { graphStats, tableStats }
}

const getCancelledStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const studyrights = await cancelledStudyRights(studyprogramme, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ canceldate }) => {
    const cancelYear = defineYear(canceldate, isAcademicYear)
    graphStats[indexOf(years, cancelYear)] += 1
    tableStats[cancelYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const studyrights = await transfersAway(studyprogramme, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const studyrights = await transfersTo(studyprogramme, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getRegularCreditStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const studyrights = await getProgrammesStudents(studyprogramme)
  const credits = await getCreditsForStudyProgramme(providercode, since)

  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)

  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studyright = studyrights.find(studyright => studyright.studentnumber == student_studentnumber)
    const attainmentYear = defineYear(attainment_date, isAcademicYear)

    if (isMajorStudentCredit(studyright, attainment_date)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else {
      nonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonMajors.tableStats[attainmentYear] += credits || 0
    }
  })

  return { majors, nonMajors }
}

const getTransferredCreditStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const credits = await getTransferredCredits(providercode, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  return { graphStats, tableStats }
}

const getThesisStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const thesisType = getThesisType(studyprogramme)
  const { graphStats, tableStats } = getStatsBasis(years)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })
      const credits = await getThesisCredits(providercode, since, thesisType, studentnumbersOfTheYear)

      credits.forEach(({ attainment_date }) => {
        const attainmentYear = defineYear(attainment_date, isAcademicYear)
        graphStats[indexOf(years, attainmentYear)] += 1
        tableStats[attainmentYear] += 1
      })
    })
  )

  return { graphStats, tableStats }
}

const getGraduationTimeStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  let graduationAmounts = getYearsObject(years)
  let graduationTimes = getYearsObject(years, true)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })

      const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbersOfTheYear)

      studyrights.forEach(({ enddate, studystartdate }) => {
        const graduationYear = defineYear(enddate, isAcademicYear)
        const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
        graduationAmounts[graduationYear] += 1
        graduationTimes[graduationYear] = [...graduationTimes[graduationYear], timeToGraduation]
      })
    })
  )
  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studyprogramme.includes('KH') ? 72 : 48

  const medians = getYearsObject(years, true)
  const means = getYearsObject(years, true)

  // HighCharts graph require the data to have this format (ie. actual value, "empty value")
  years.forEach(year => {
    const median = getMedian(graduationTimes[year])
    const mean = getMean(graduationTimes[year])
    medians[year] = [
      ['', median],
      ['', comparisonValue - median],
    ]
    means[year] = [
      ['', mean],
      ['', comparisonValue - mean],
    ]
  })
  return { medians, means, graduationAmounts }
}

const getCorrectStudentnumbers = async ({ codes, startDate, endDate, includeAllSpecials }) => {
  let studentnumbers = []
  const exchangeStudents = includeAllSpecials
  const cancelledStudents = includeAllSpecials
  const nondegreeStudents = includeAllSpecials
  const transferredOutStudents = includeAllSpecials
  const transferredToStudents = !includeAllSpecials

  studentnumbers = await studentnumbersWithAllStudyrightElements(
    codes,
    startDate,
    endDate,
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents,
    transferredOutStudents,
    null,
    transferredToStudents
  )

  return studentnumbers
}

const getBasicStatsForStudytrack = async ({ studyprogramme, yearType, specialGroups }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const started = await getStartedStats(queryParameters)
  const graduated = await getGraduatedStats(queryParameters)
  const cancelled = await getCancelledStats(queryParameters)
  const transferredAway = await getTransferredAwayStats(queryParameters)
  const transferredTo = await getTransferredToStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const titles = includeAllSpecials
    ? ['', 'Started', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to']
    : ['', 'Started', 'Graduated']
  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          started.tableStats[year],
          graduated.tableStats[year],
          cancelled.tableStats[year],
          transferredAway.tableStats[year],
          transferredTo.tableStats[year],
        ]
      : [year, started.tableStats[year], graduated.tableStats[year]]
  )

  return {
    id: studyprogramme,
    years,
    graphStats: includeAllSpecials
      ? [
          {
            name: 'Started',
            data: started.graphStats,
          },
          {
            name: 'Graduated',
            data: graduated.graphStats,
          },
          {
            name: 'Cancelled',
            data: cancelled.graphStats,
          },
          {
            name: 'Transferred away',
            data: transferredAway.graphStats,
          },
          {
            name: 'Transferred To',
            data: transferredTo.graphStats,
          },
        ]
      : [
          {
            name: 'Started',
            data: started.graphStats,
          },
          {
            name: 'Graduated',
            data: graduated.graphStats,
          },
        ],
    tableStats,
    titles,
  }
}

const getCreditStatsForStudytrack = async ({ studyprogramme, yearType, specialGroups }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear }
  const { majors, nonMajors } = await getRegularCreditStats(queryParameters)
  const transferred = await getTransferredCreditStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = includeAllSpecials
    ? ['', 'Total', 'Major students credits', 'Non major students credits', 'Transferred credits']
    : ['', 'Total', 'Major students credits', 'Non major students credits', 'Transferred credits']

  const tableStats = reversedYears.map(year => [
    year,
    majors.tableStats[year] + nonMajors.tableStats[year] + transferred.tableStats[year],
    majors.tableStats[year],
    nonMajors.tableStats[year],
    transferred.tableStats[year],
  ])

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats: [
      {
        name: 'Major students credits',
        data: majors.graphStats,
      },
      {
        name: 'Non-major students credits',
        data: nonMajors.graphStats,
      },
      {
        name: 'Transferred credits',
        data: transferred.graphStats,
      },
    ],
    titles,
  }
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, yearType, specialGroups }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const thesis = await getThesisStats(queryParameters)
  const graduated = await getGraduatedStats(queryParameters)
  const graduationTimeStats = await getGraduationTimeStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = ['', 'Graduated', 'Wrote thesis']
  const tableStats = reversedYears.map(year => [year, graduated.tableStats[year], thesis.tableStats[year]])

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats: [
      {
        name: 'Graduated students',
        data: graduated.graphStats,
      },
      {
        name: 'Wrote thesis',
        data: thesis.graphStats,
      },
    ],
    graduationMedianTime: graduationTimeStats.medians,
    graduationMeanTime: graduationTimeStats.means,
    graduationAmounts: graduationTimeStats.graduationAmounts,
    titles,
  }
}

module.exports = {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
}
