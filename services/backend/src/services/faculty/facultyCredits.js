const { indexOf, uniqBy } = require('lodash')
const { mapToProviders } = require('../../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  isNonMajorCredit,
  getYearsArray,
  getStartDate,
} = require('../studyprogramme/studyprogrammeHelpers')
const { getCourseCodesForStudyProgramme } = require('../studyprogramme')
const { getCreditsForStudyProgramme } = require('../studyprogramme/creditGetters')
const { getStudyRights } = require('../studyprogramme/studyrightFinders')

const isFacultyNonMajorCredit = (studyrights, attainmentDate, facultyProgrammes, facultyCode) => {
  let right = ''
  studyrights.forEach(studyright => {
    if (studyright && studyright.facultyCode === facultyCode) {
      const startDate =
        studyright.studyrightid.slice(-2) === '-2' && studyright.extentcode === 2
          ? studyright.studystartdate
          : studyright.startdate
      if (!studyright.graduated && new Date(attainmentDate) >= new Date(startDate)) {
        if (!right) right = studyright.code
        else if (right && !facultyProgrammes.includes(right) && facultyProgrammes.includes(studyright.code))
          right = studyright.code
      } else {
        if (
          new Date(attainmentDate) >= new Date(startDate) &&
          new Date(attainmentDate) <= new Date(studyright.enddate)
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
const isFacultyOtherCredit = (studyrights, attainmentDate) => {
  return studyrights.some(studyright => {
    return (
      studyright &&
      [6, 7, 23, 34, 99].includes(studyright.extentcode) &&
      new Date(attainmentDate) >= new Date(studyright.startdate)
    )
  })
}

// Fetches all the credits for the studyprogramme and divides them into major-students, non-major faculty students,
// non-major other faculty students, other (exhange students) and non-degree student credits.
// Division is done on the basis that whether the student had a primary studyright to the programme on the attainment_date
const getFacultyRegularCreditStats = async ({
  studyprogramme,
  since,
  years,
  isAcademicYear,
  facultyProgrammes,
  facultyCode,
}) => {
  let majors = getStatsBasis(years) // Has studyright to programme
  let facultyNonMajors = getStatsBasis(years) // Has studyright in the same faculty but not in the programme from which credits are
  let facultyOthers = getStatsBasis(years) // Exchange students, specialization education in Medicine, Dentistry and vetenary medicine, continuous education
  let otherNonMajors = getStatsBasis(years) // Has studyright in different faculty
  let nonDegree = getStatsBasis(years) // open uni, non-degree study rights, contract studies, (other) specialisation education, credits outside of the studyright
  if (!studyprogramme) {
    return { majors, facultyNonMajors, otherNonMajors, facultyOthers, nonDegree }
  }

  const providercode = mapToProviders([studyprogramme])[0]
  const providedByProgramme = await getCourseCodesForStudyProgramme(providercode)
  const allCredits = await getCreditsForStudyProgramme(providercode, providedByProgramme, since)
  const credits = uniqBy(allCredits, 'id')
  const students = [...new Set(credits.map(({ studentNumber }) => studentNumber))]

  let studyrights = await getStudyRights(students)

  const studentNumberToStudyrightsMap = studyrights.reduce((obj, cur) => {
    if (!obj[cur.studentNumber]) obj[cur.studentNumber] = []
    obj[cur.studentNumber].push(cur)
    return obj
  }, {})

  credits.forEach(({ studentNumber, attainmentDate, credits }) => {
    const studentStudyrights = studentNumberToStudyrightsMap[studentNumber] || []
    const attainmentYear = defineYear(attainmentDate, isAcademicYear)

    if (isMajorStudentCredit(studentStudyrights, attainmentDate, studyprogramme)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else if (isNonMajorCredit(studentStudyrights, attainmentDate)) {
      if (isFacultyNonMajorCredit(studentStudyrights, attainmentDate, facultyProgrammes, facultyCode)) {
        facultyNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
        facultyNonMajors.tableStats[attainmentYear] += credits || 0
      } else {
        otherNonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
        otherNonMajors.tableStats[attainmentYear] += credits || 0
      }
    } else if (isFacultyOtherCredit(studentStudyrights, attainmentDate)) {
      facultyOthers.graphStats[indexOf(years, attainmentYear)] += credits || 0
      facultyOthers.tableStats[attainmentYear] += credits || 0
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

  return { majors, facultyNonMajors, otherNonMajors, facultyOthers, nonDegree }
}

// Fetches all credits for the studytrack and combines them into statistics
// These are for the faculty view which differs from study programme overview
// (no transfers, non majors split to in- and outside-faculty)
const getFacultyCreditStatsForStudytrack = async ({
  studyprogramme,
  facultyProgrammes,
  isAcademicYear,
  facultyCode,
}) => {
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, facultyProgrammes, facultyCode }
  const { majors, facultyNonMajors, otherNonMajors, facultyOthers, nonDegree } = await getFacultyRegularCreditStats(
    queryParameters
  )

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const dataFound = [majors, facultyNonMajors, otherNonMajors].some(d => d.graphStats.length) // , transferred

  if (!dataFound) return null

  const tableStats = reversedYears.map(year => [
    year,
    majors.tableStats[year] +
      facultyNonMajors.tableStats[year] +
      otherNonMajors.tableStats[year] +
      nonDegree.tableStats[year] +
      facultyOthers.tableStats[year],
    majors.tableStats[year],
    facultyNonMajors.tableStats[year],
    otherNonMajors.tableStats[year],
    nonDegree.tableStats[year],
    facultyOthers.tableStats[year],
  ])

  const graphStats = [
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
    {
      other: 'Other credits',
      data: facultyOthers.graphStats,
    },
  ]

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats,
  }
}

const getProgrammeCredits = async (code, yearType, facultyProgrammes, faculty) => {
  const updatedStats = await getFacultyCreditStatsForStudytrack({
    facultyCode: faculty,
    studyprogramme: code,
    facultyProgrammes,
    isAcademicYear: yearType === 'ACADEMIC_YEAR',
  })

  return updatedStats
}

const combineFacultyCredits = async (faculty, programmes, allProgrammes, yearType) => {
  let counts = {}
  let years = []
  const titles = [
    '',
    'Total',
    'Major students credits',
    'Non-major faculty students credits',
    'Non-major other faculty students credits',
    'Non-degree student credits',
    'Other non-degree credits',
  ]

  let allCredits = {
    id: faculty,
    years: [],
    tableStats: [],
    graphStats: [],
    programmeTableStats: {},
    programmeNames: {},
    titles,
  }

  const progCodes = allProgrammes.map(p => p.code)
  for (const prog of programmes) {
    if (prog.code === 'MH70_008_2') continue
    const data = await getProgrammeCredits(prog.code, yearType, progCodes, faculty)
    if (data) {
      allCredits.programmeNames[prog.progId] = { code: prog.code, ...prog.name }
      allCredits.programmeTableStats[prog.progId] = data.tableStats
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
  let facultyOthers = []
  let nonDegree = []

  years.forEach(year => {
    majors.push(counts[year][1])
    facultyNonMajor.push(counts[year][2])
    otherNonMajor.push(counts[year][3])
    facultyOthers.push(counts[year][4])
    nonDegree.push(counts[year][5])
  })

  allCredits.graphStats = [
    { name: 'Major students credits', data: majors },
    { name: 'Non-major faculty students credits', data: facultyNonMajor },
    { name: 'Non-major other faculty students credits', data: otherNonMajor },
    { name: 'Non-degree credits', data: nonDegree },
    { name: 'Other non-degree credits', data: facultyOthers },
  ]
  return allCredits
}

module.exports = { combineFacultyCredits }
