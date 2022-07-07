const { indexOf } = require('lodash')
const { getBasicStats, setBasicStats } = require('./analyticsService')
const { getBasicStatsForStudytrack } = require('./studyprogrammeBasics')
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
  allTransfers,
  getCourseCodesForStudyProgramme,
} = require('./studyprogramme')

const combineFacultyBasics = async (allBasics, programmes, yearType, specialGroups, counts, years) => {
  for (const prog of programmes) {
    const data = await getProgrammeBasics(prog, yearType, specialGroups)
    if (data) {
      if (!allBasics.lastUpdated || new Date(data.lastUpdated) > new Date(allBasics.lastUpdated))
        allBasics.lastUpdated = data.lastUpdated

      data.tableStats.forEach(row => {
        if (!(row[0] in counts)) {
          counts[row[0]] = row.slice(1)
          years.push(row[0])
        } else {
          counts[row[0]] = row.slice(1).map((value, i) => {
            return counts[row[0]][i] + value
          })
        }
      })
    }
  }
  // save table stats and graph stats
  years.forEach(year => {
    allBasics.tableStats.push([year, ...counts[year]])
  })

  years.sort()
  allBasics.years = years
}

const combineFacultyCredits = async (allCredits, programmes, yearType, specialGroups, counts, years) => {
  for (const prog of programmes) {
    const data = await getProgrammeCredits(prog, yearType, specialGroups)
    if (data) {
      if (!allCredits.lastUpdated || new Date(data.lastUpdated) > new Date(allCredits.lastUpdated))
        allCredits.lastUpdated = data.lastUpdated

      data.tableStats.forEach(row => {
        if (!(row[0] in counts)) {
          counts[row[0]] = row.slice(1)
          years.push(row[0])
        } else {
          counts[row[0]] = row.slice(1).map((value, i) => {
            return counts[row[0]][i] + value
          })
        }
      })
    }
  }
  // save table stats and graph stats
  years.forEach(year => {
    allCredits.tableStats.push([year, ...counts[year]])
  })

  years.sort()
  allCredits.years = years
}

const getProgrammeBasics = async (code, yearType, specialGroups) => {
  const data = await getBasicStats(code, yearType, specialGroups)
  if (data) return data

  const updated = await getBasicStatsForStudytrack({
    studyprogramme: code,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updated) await setBasicStats(updated, yearType, specialGroups)
  return updated
}

const getProgrammeCredits = async (code, yearType, specialGroups) => {
  // redis?
  // const data = await getCreditStats(code, yearType, specialGroups)
  // if (data) return data
  const updatedStats = await getFacultyCreditStatsForStudytrack({
    studyprogramme: code,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })

  // if (updatedStats) await setCreditStats(updatedStats, yearType, specialGroups)
  return updatedStats
}

// Fetches all the credits for the studyprogramme and divides them into major-students and non-major students credits
// Division is done on the basis that whether the student had a primary studyright to the programme on the attainment_date
const getFacultyRegularCreditStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const courses = await getCourseCodesForStudyProgramme(providercode)
  const credits = await getCreditsForStudyProgramme(courses, since)
  const students = [...new Set(credits.map(({ student_studentnumber }) => student_studentnumber))]

  let studyrights = await getStudyRights(students, since)
  const transfers = (await allTransfers(studyprogramme, since)).map(t => t.studyrightid)
  if (!includeAllSpecials) {
    studyrights = studyrights.filter(s => !transfers.includes(s.studyrightid))
  }

  let majors = getStatsBasis(years)
  let allNonMajors = getStatsBasis(years)
  let nonDegree = getStatsBasis(years)

  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studentStudyrights = studyrights.filter(studyright => studyright.studentnumber === student_studentnumber)
    const attainmentYear = defineYear(attainment_date, isAcademicYear)

    if (!includeAllSpecials && isSpecialGroupCredit(studentStudyrights, attainment_date, transfers)) {
      return
    }

    if (isMajorStudentCredit(studentStudyrights, attainment_date, studyprogramme)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else if (isNonMajorCredit(studentStudyrights, attainment_date, studyprogramme)) {
      allNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      allNonMajors.tableStats[attainmentYear] += credits || 0
    } else {
      nonDegree.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonDegree.tableStats[attainmentYear] += credits || 0
    }
  })

  if (
    majors.graphStats.every(year => year === 0) &&
    allNonMajors.graphStats.every(year => year === 0) &&
    nonDegree.graphStats.every(year => year === 0)
  ) {
    return {
      majors: { graphStats: [], tableStats: {} },
      allNonMajors: { graphStats: [], tableStats: {} },
      nonDegree: { graphStats: [], tablestats: {} },
    }
  }

  return { majors, allNonMajors, nonDegree }
}

// Fetches all credits for the studytrack and combines them into statistics
// These are for the faculty view which differs from study programme overview
// (no tranfers, non majors split to in- and outside-faculty)
const getFacultyCreditStatsForStudytrack = async ({ studyprogramme, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const { majors, allNonMajors, nonDegree } = await getFacultyRegularCreditStats(queryParameters)
  // const transferred = { graphStats: [], tableStats: {} } // await getTransferredCreditStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const titles = tableTitles['credits'][includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED']
  const dataFound = [majors, allNonMajors].some(d => d.graphStats.length) // , transferred

  if (!dataFound) return null

  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          majors.tableStats[year] +
            allNonMajors.tableStats[year] +
            allNonMajors.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          allNonMajors.tableStats[year],
          allNonMajors.tableStats[year],
          nonDegree.tableStats[year],
        ]
      : [
          year,
          majors.tableStats[year] +
            allNonMajors.tableStats[year] +
            allNonMajors.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
        ]
  )

  const graphStats = [
    {
      name: 'Major students credits',
      data: majors.graphStats,
    },
    {
      name: 'Non-major students credits',
      data: allNonMajors.graphStats,
    },
    {
      name: 'Non-major students credits 2',
      data: allNonMajors.graphStats,
    },
    {
      name: 'Non-degree credits',
      data: nonDegree.graphStats,
    },
  ]

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats,
    titles,
  }
}

module.exports = { combineFacultyBasics, combineFacultyCredits, getFacultyCreditStatsForStudytrack }
