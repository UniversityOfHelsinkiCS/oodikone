const {
  getStartDate,
  getYearsArray,
  getPercentage,
  getYearsObject,
  getCorrectStudentnumbers,
  tableTitles,
} = require('../studyprogrammeHelpers')
const {
  studytrackStudents,
  allStudyrights,
  startedStudyrights,
  inactiveStudyrights,
  enrolledStudents,
  absentStudents,
  graduatedStudyRights,
} = require('../studyprogramme')
const { getAcademicYearDates } = require('../../util/semester')

const getStudentData = students => {
  let data = { female: 0, male: 0, finnish: 0 }

  students.forEach(({ gender_code, home_country_en }) => {
    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
  })
  return data
}

// Goes through the faculty and its study programmes for the year
const getFacultyDataForYear = async ({ programmes, since, settings, year, programmeTableStats }) => {
  const { includeAllSpecials, includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)

  let total = 0
  let allStarted = 0
  let allEnrolled = 0
  let allAbsent = 0
  let allInactive = 0
  let allGraduated = 0
  let allFinnish = 0
  let allFemale = 0
  let allMale = 0

  for (const programme of programmes.data) {
    const studentnumbers = await getCorrectStudentnumbers({
      codes: [programme.code],
      startDate,
      endDate,
      includeAllSpecials,
      includeGraduated,
    })

    // Get all the studyrights and students for the calculations
    const all = await allStudyrights(programme.code, studentnumbers)
    const students = await studytrackStudents(studentnumbers)
    const studentData = getStudentData(students)
    const started = await startedStudyrights(programme.code, startDate, studentnumbers)
    const enrolled = await enrolledStudents(programme.code, startDate, studentnumbers)
    const absent = await absentStudents(programme.code, studentnumbers)
    const inactive = await inactiveStudyrights(programme.code, studentnumbers)
    const graduated = await graduatedStudyRights(programme.code, startDate, studentnumbers)
    // if (all.length === 0) {
    //   return
    // }
    // Count stats for the programme
    if (!(programme.code in programmeTableStats)) programmeTableStats[programme.code] = []

    programmeTableStats[programme.code] = [
      ...programmeTableStats[programme.code],
      [
        year,
        all.length,
        getPercentage(all.length, all.length),
        started.length,
        getPercentage(started.length, all.length),
        enrolled.length,
        getPercentage(enrolled.length, all.length),
        absent.length,
        getPercentage(absent.length, all.length),
        inactive.length,
        getPercentage(inactive.length, all.length),
        graduated.length,
        getPercentage(graduated.length, all.length),
        studentData.male,
        getPercentage(studentData.male, all.length),
        studentData.female,
        getPercentage(studentData.female, all.length),
        studentData.finnish,
        getPercentage(studentData.finnish, all.length),
      ],
    ]

    total += all.length
    allStarted += started.length
    allEnrolled += enrolled.length
    allAbsent += absent.length
    allInactive += inactive.length
    allGraduated += graduated.length
    allFemale += studentData.female
    allMale += studentData.male
    allFinnish += studentData.finnish
  }
  // Add totals for the year into table stats
  const totals = {
    total,
    allStarted,
    allEnrolled,
    allAbsent,
    allInactive,
    allGraduated,
    allMale,
    allFemale,
    allFinnish,
  }
  return totals
}

// Combines all the data for the Populations and Studytracks -view
const getFacultyStudents = async (code, programmes, specialGroups, graduated) => {
  const isAcademicYear = true
  const includeAllSpecials = specialGroups === 'INCLUDE_SPECIALS'
  const includeGraduated = graduated === 'INCLUDE_GRADUATED'
  const includeYearsCombined = true
  const since = getStartDate(code, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)
  const settings = { includeAllSpecials, includeGraduated }
  let facultyTableStats = getYearsObject({ years, emptyArrays: true })
  let programmeTableStats = {}

  for (const year of years.reverse()) {
    const queryParams = { programmes, since, settings, year, programmeTableStats }
    const totals = await getFacultyDataForYear(queryParams)
    facultyTableStats[year] = [
      year,
      totals.total,
      getPercentage(totals.total, totals.total),
      totals.allStarted,
      getPercentage(totals.allStarted, totals.total),
      totals.allEnrolled,
      getPercentage(totals.allEnrolled, totals.total),
      totals.allAbsent,
      getPercentage(totals.allAbsent, totals.total),
      totals.allInactive,
      getPercentage(totals.allInactive, totals.total),
      totals.allGraduated,
      getPercentage(totals.allGraduated, totals.total),
      totals.allMale,
      getPercentage(totals.allMale, totals.total),
      totals.allFemale,
      getPercentage(totals.allFemale, totals.total),
      totals.allFinnish,
      getPercentage(totals.allFinnish, totals.total),
    ]
  }

  const studentsData = {
    id: code,
    facultyTableStats: facultyTableStats,
    programmeStats: programmeTableStats,
    titles: tableTitles['studytracks'],
    programmeNames: programmes.data.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
  }
  return studentsData
}

module.exports = { getFacultyStudents }
