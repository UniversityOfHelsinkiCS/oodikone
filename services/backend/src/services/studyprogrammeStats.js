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

const getGraduatedStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await graduatedStudyRights(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ enddate }) => {
    const graduationYear = defineYear(enddate, isAcademicYear)
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  })
  return { graphStats, tableStats }
}

const getStartedStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await startedStudyrights(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    graphStats[indexOf(years, startYear)] += 1
    tableStats[startYear] += 1
  })
  return { graphStats, tableStats }
}

const getCancelledStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await cancelledStudyRights(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ canceldate }) => {
    const cancelYear = defineYear(canceldate, isAcademicYear)
    graphStats[indexOf(years, cancelYear)] += 1
    tableStats[cancelYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await transfersAway(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await transfersTo(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getRegularCreditStats = async (studytrack, since, years, isAcademicYear) => {
  const providercode = mapToProviders([studytrack])[0]
  const studyrights = await getProgrammesStudents(studytrack)
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

const getTransferredCreditStats = async (studytrack, since, years, isAcademicYear) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getTransferredCredits(providercode, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  return { graphStats, tableStats }
}

const getThesisStats = async (studytrack, since, years, isAcademicYear) => {
  const credits = await getThesisCredits(studytrack, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += 1
    tableStats[attainmentYear] += 1
  })

  return { graphStats, tableStats }
}

const getGraduationTimeStats = async (studytrack, since, years, isAcademicYear) => {
  const studyrights = await graduatedStudyRights(studytrack, since)
  let graduationAmounts = getYearsObject(years)
  let graduationTimes = getYearsObject(years, true)

  studyrights.forEach(({ enddate, studystartdate }) => {
    const graduationYear = defineYear(enddate, isAcademicYear)
    const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
    graduationAmounts[graduationYear] += 1
    graduationTimes[graduationYear] = [...graduationTimes[graduationYear], timeToGraduation]
  })

  const medians = getYearsObject(years, true)
  const means = getYearsObject(years, true)

  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studytrack.includes('KH') ? 72 : 48

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

const getBasicStatsForStudytrack = async ({ studyprogramme, yearType }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const started = await getStartedStats(studyprogramme, since, years, isAcademicYear)
  const graduated = await getGraduatedStats(studyprogramme, since, years, isAcademicYear)
  const cancelled = await getCancelledStats(studyprogramme, since, years, isAcademicYear)
  const transferredAway = await getTransferredAwayStats(studyprogramme, since, years, isAcademicYear)
  const transferredTo = await getTransferredToStats(studyprogramme, since, years, isAcademicYear)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const tableStats = reversedYears.map(year => [
    year,
    started.tableStats[year],
    graduated.tableStats[year],
    cancelled.tableStats[year],
    transferredAway.tableStats[year],
    transferredTo.tableStats[year],
  ])

  return {
    id: studyprogramme,
    years,
    graphStats: [
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
    ],
    tableStats,
  }
}

const getCreditStatsForStudytrack = async ({ studyprogramme, yearType }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const { majors, nonMajors } = await getRegularCreditStats(studyprogramme, since, years, isAcademicYear)
  const transferred = await getTransferredCreditStats(studyprogramme, since, years, isAcademicYear)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
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
  }
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, yearType }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const thesis = await getThesisStats(studyprogramme, since, years, isAcademicYear)
  const graduated = await getGraduatedStats(studyprogramme, since, years, isAcademicYear)
  const graduationTimeStats = await getGraduationTimeStats(studyprogramme, since, years, isAcademicYear)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
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
  }
}

module.exports = {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
}
