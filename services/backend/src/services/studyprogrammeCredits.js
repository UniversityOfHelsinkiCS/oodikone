const { indexOf } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  isNonMajorCredit,
  getYearsArray,
  getStartDate,
  isSpecialGroupCredit,
  tableTitles,
} = require('./studyprogrammeHelpers')
const {
  getStudyRights,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  allTransfers,
  getCourseCodesForStudyProgramme,
} = require('./studyprogramme')

const createGraphStats = (majors, nonMajors, nonDegree, transferred) => {
  return [
    {
      name: 'Major students credits',
      data: majors.graphStats,
    },
    {
      name: 'Non-major students credits',
      data: nonMajors.graphStats,
    },
    {
      name: 'Non-degree credits',
      data: nonDegree.graphStats,
    },
    {
      name: 'Transferred credits',
      data: transferred.graphStats,
    },
  ]
}

const createTableStats = (reversedYears, includeAllSpecials, majors, nonMajors, transferred, nonDegree) => {
  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          majors.tableStats[year] +
            nonMajors.tableStats[year] +
            transferred.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          nonMajors.tableStats[year],
          nonDegree.tableStats[year],
          transferred.tableStats[year],
        ]
      : [
          year,
          majors.tableStats[year] +
            nonMajors.tableStats[year] +
            transferred.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          transferred.tableStats[year],
        ]
  )
  return tableStats
}

// Fetches all the credits for the studyprogramme and divides them into major-students and non-major students credits
// Division is done on the basis that whether the student had a primary studyright to the programme on the attainmentDate
// If special groups are excluded, the transfer students are filtered away from the major-students as well
const getRegularCreditStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)
  let nonDegree = getStatsBasis(years)
  if (!studyprogramme) {
    return { majors, nonMajors, nonDegree }
  }

  const providercode = mapToProviders([studyprogramme])[0]
  const courses = await getCourseCodesForStudyProgramme(providercode)
  const credits = await getCreditsForStudyProgramme(providercode, courses, since)
  const students = [...new Set(credits.map(({ studentNumber }) => studentNumber))]

  let studyrights = await getStudyRights(students, since)
  const transfers = (await allTransfers(studyprogramme, since)).map(t => t.studyrightid)
  if (!includeAllSpecials) {
    studyrights = studyrights.filter(s => !transfers.includes(s.studyrightid))
  }

  credits.forEach(({ studentNumber, attainmentDate, credits }) => {
    const studentStudyrights = studyrights.filter(studyright => studyright.studentNumber === studentNumber)
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)

    if (!includeAllSpecials && isSpecialGroupCredit(studentStudyrights, attainmentDate, transfers)) {
      return
    }

    if (isMajorStudentCredit(studentStudyrights, attainmentDate, studyprogramme)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else if (isNonMajorCredit(studentStudyrights, attainmentDate, studyprogramme)) {
      nonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonMajors.tableStats[attainmentYear] += credits || 0
    } else {
      nonDegree.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonDegree.tableStats[attainmentYear] += credits || 0
    }
  })

  return { majors, nonMajors, nonDegree }
}

// Fetches all the credits with the type "transferred / hyväksiluettu" and divides them by year
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

// Fetches all credits for the studytrack and combines them into the statistics for the table
// and graph in the studyprogramme overview
const getCreditStatsForStudytrack = async ({ studyprogramme, combinedProgramme, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const queryParametersSecondProg = {
    studyprogramme: combinedProgramme,
    since,
    years,
    isAcademicYear,
    includeAllSpecials,
  }
  const { majors, nonMajors, nonDegree } = await getRegularCreditStats(queryParameters)
  const transferred = await getTransferredCreditStats(queryParameters)

  const {
    majors: majorsSecondProg,
    nonMajors: nonMajorsSecondProg,
    nonDegree: nonDegreeSecondProg,
  } = await getRegularCreditStats(queryParametersSecondProg)
  const transferredSecondProg = await getTransferredCreditStats(queryParametersSecondProg)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const titles = tableTitles['credits'][includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED']
  const dataFound = [majors, nonMajors, transferred].some(d => d.graphStats.length)

  if (!dataFound) return null
  const dataFoundSecondProg = [majorsSecondProg, nonMajorsSecondProg, transferredSecondProg].some(
    d => d.graphStats.length
  )
  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years,
    tableStats: createTableStats(reversedYears, includeAllSpecials, majors, nonMajors, transferred, nonDegree),
    graphStats: createGraphStats(majors, nonMajors, nonDegree, transferred),
    tableStatsSecondProg: dataFoundSecondProg
      ? createTableStats(
          reversedYears,
          includeAllSpecials,
          majorsSecondProg,
          nonMajorsSecondProg,
          transferredSecondProg,
          nonDegreeSecondProg
        )
      : [],
    graphStatsSecondProg: dataFoundSecondProg
      ? createGraphStats(majorsSecondProg, nonMajorsSecondProg, nonDegreeSecondProg, transferredSecondProg)
      : [],
    titles,
  }
}

module.exports = {
  getCreditStatsForStudytrack,
}
