const { indexOf } = require('lodash')
const { mapToProviders } = require('../../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  isNonMajorCredit,
  getYearsArray,
  getStartDate,
  isSpecialGroupCredit,
} = require('../studyprogrammeHelpers')
const {
  getStudyRights,
  getCreditsForStudyProgramme,
  allTransfers,
  getCourseCodesForStudyProgramme,
} = require('../studyprogramme')

const isFacultyNonMajorCredit = (studyrights, attainment_date, facultyProgrammes) => {
  let right = ''
  studyrights.forEach(studyright => {
    if (studyright) {
      if (!studyright.graduated && new Date(attainment_date) >= new Date(studyright.studystartdate)) {
        if (!right) right = studyright.code
        else if (right && !facultyProgrammes.includes(right) && facultyProgrammes.includes(studyright.code))
          right = studyright.code
      } else {
        if (
          new Date(attainment_date) >= new Date(studyright.studystartdate) &&
          new Date(attainment_date) <= new Date(studyright.enddate)
        ) {
          if (!right) right = studyright.code
          else if (right && !facultyProgrammes.includes(right) && facultyProgrammes.includes(studyright.code))
            right = studyright.code
        }
      }
    }
  })
  return facultyProgrammes.includes(right)
}

// Fetches all the credits for the studyprogramme and divides them into major-students, non-major faculty students,
// non-major other faculty students adn non-degree student credits
// Division is done on the basis that whether the student had a primary studyright to the programme on the attainment_date
const getFacultyRegularCreditStats = async ({
  studyprogramme,
  since,
  years,
  isAcademicYear,
  includeAllSpecials,
  facultyProgrammes,
}) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const courses = await getCourseCodesForStudyProgramme(providercode)
  const credits = await getCreditsForStudyProgramme(courses, since)
  const students = [...new Set(credits.map(({ student_studentnumber }) => student_studentnumber))]

  let studyrights = await getStudyRights(students, since)
  const transfers = (await allTransfers(studyprogramme, since)).map(t => t.studyrightid)

  let majors = getStatsBasis(years)
  let allNonMajors = getStatsBasis(years)
  let facultyNonMajors = getStatsBasis(years)
  let otherNonMajors = getStatsBasis(years)
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
    } else if (isNonMajorCredit(studentStudyrights, attainment_date)) {
      // for comparison
      allNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      allNonMajors.tableStats[attainmentYear] += credits || 0

      if (isFacultyNonMajorCredit(studentStudyrights, attainment_date, facultyProgrammes)) {
        facultyNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
        facultyNonMajors.tableStats[attainmentYear] += credits || 0
      } else {
        otherNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
        otherNonMajors.tableStats[attainmentYear] += credits || 0
      }
    } else {
      nonDegree.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonDegree.tableStats[attainmentYear] += credits || 0
    }
  })
  if (
    majors.graphStats.every(year => year === 0) &&
    facultyNonMajors.graphStats.every(year => year === 0) &&
    otherNonMajors.graphStats.every(year => year === 0) &&
    nonDegree.graphStats.every(year => year === 0)
  ) {
    return {
      majors: { graphStats: [], tableStats: {} },
      facultyNonMajors: { graphStats: [], tableStats: {} },
      otherNonMajors: { graphStats: [], tableStats: {} },
      nonDegree: { graphStats: [], tablestats: {} },
    }
  }

  return { majors, facultyNonMajors, otherNonMajors, nonDegree }
}

// Fetches all credits for the studytrack and combines them into statistics
// These are for the faculty view which differs from study programme overview
// (no transfers, non majors split to in- and outside-faculty)
const getFacultyCreditStatsForStudytrack = async ({ studyprogramme, facultyProgrammes, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials, facultyProgrammes }
  const { majors, facultyNonMajors, otherNonMajors, nonDegree } = await getFacultyRegularCreditStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const dataFound = [majors, facultyNonMajors, otherNonMajors].some(d => d.graphStats.length) // , transferred

  if (!dataFound) return null

  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          majors.tableStats[year] +
            facultyNonMajors.tableStats[year] +
            otherNonMajors.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          facultyNonMajors.tableStats[year],
          otherNonMajors.tableStats[year],
          nonDegree.tableStats[year],
        ]
      : [
          year,
          majors.tableStats[year] +
            facultyNonMajors.tableStats[year] +
            otherNonMajors.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
        ]
  )

  const graphStats = includeAllSpecials
    ? [
        {
          name: 'Major students credits',
          data: majors.graphStats,
        },
        {
          name: 'Non-major faculty students credits',
          data: facultyNonMajors.graphStats,
        },
        {
          name: 'Non-major other faculty students credits 2',
          data: otherNonMajors.graphStats,
        },
        {
          name: 'Non-degree credits',
          data: nonDegree.graphStats,
        },
      ]
    : [
        {
          name: 'Major students credits',
          data: majors.graphStats,
        },
      ]

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats,
  }
}

const getProgrammeCredits = async (code, yearType, specialGroups, facultyProgrammes) => {
  const updatedStats = await getFacultyCreditStatsForStudytrack({
    studyprogramme: code,
    facultyProgrammes,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })

  return updatedStats
}

const combineFacultyCredits = async (faculty, programmes, yearType, specialGroups) => {
  let counts = {}
  let years = []
  const titles =
    specialGroups === 'SPECIAL_INCLUDED'
      ? [
          '',
          'Total',
          'Major students credits',
          'Non-major faculty students credits',
          'Non-major other faculty students credits',
          'Non-degree student credits',
        ]
      : ['', 'Total', 'Major students credits']

  let allCredits = {
    id: faculty,
    years: [],
    tableStats: [],
    graphStats: [],
    programmeTableStats: {},
    programmeNames: {},
    titles,
  }

  const progCodes = programmes.map(p => p.code)
  for (const prog of programmes) {
    const data = await getProgrammeCredits(prog.code, yearType, specialGroups, progCodes)
    if (data) {
      allCredits.programmeNames[prog.code] = prog.name
      allCredits.programmeTableStats[prog.code] = data.tableStats
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

  let majors = []
  let facultyNonMajor = []
  let otherNonMajor = []
  let nonDegree = []

  years.forEach(year => {
    majors.push(counts[year][1])
    facultyNonMajor.push(counts[year][2])
    otherNonMajor.push(counts[year][3])
    nonDegree.push(counts[year][4])
  })

  allCredits.graphStats =
    specialGroups === 'SPECIAL_INCLUDED'
      ? [
          { name: 'Major students credits', data: majors },
          { name: 'Non-major faculty students credits', data: facultyNonMajor },
          { name: 'Non-major other faculty students credits', data: otherNonMajor },
          { name: 'Non-degree credits', data: nonDegree },
        ]
      : [{ name: 'Major students credits', data: majors }]

  return allCredits
}

module.exports = { combineFacultyCredits, getFacultyCreditStatsForStudytrack }
