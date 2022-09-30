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
const getFacultyDataForYear = async ({ programmes, since, settings, year, years, programmeTableStats }) => {
  const { includeAllSpecials, includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)
  // Totals for the year into table stats
  const totals = {
    total: 0,
    allStarted: 0,
    allEnrolled: 0,
    allAbsent: 0,
    allInactive: 0,
    allGraduated: 0,
    allFinnish: 0,
    allFemale: 0,
    allMale: 0,
  }

  for (const programme of programmes) {
    const studentnumbers = await getCorrectStudentnumbers({
      codes: [programme.code],
      startDate,
      endDate,
      includeAllSpecials,
      includeGraduated,
    })

    // Get all the studyrights and students for the calculations
    let all = await allStudyrights(programme.code, studentnumbers)
    const students = await studytrackStudents(studentnumbers)
    const studentData = getStudentData(students)
    const started = await startedStudyrights(programme.code, startDate, studentnumbers)
    const enrolled = await enrolledStudents(programme.code, startDate, studentnumbers)
    const absent = await absentStudents(programme.code, studentnumbers)
    const inactive = await inactiveStudyrights(programme.code, studentnumbers)
    const graduated = await graduatedStudyRights(programme.code, startDate, studentnumbers)

    // Count stats for the programme
    if (!(programme.code in programmeTableStats)) {
      programmeTableStats[programme.code] = years.reduce((resultObj, yearKey) => {
        return { ...resultObj, [yearKey]: [] }
      }, {})
    }

    programmeTableStats[programme.code][year] = [
      all.length,
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
    ]

    totals.total += all.length
    totals.allStarted += started.length
    totals.allEnrolled += enrolled.length
    totals.allAbsent += absent.length
    totals.allInactive += inactive.length
    totals.allGraduated += graduated.length
    totals.allFemale += studentData.female
    totals.allMale += studentData.male
    totals.allFinnish += studentData.finnish
  }

  return totals
}

// Combines all the data for faculty students table
const combineFacultyStudents = async (code, programmes, specialGroups, graduated) => {
  // Only academic years are considered
  const isAcademicYear = true
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const includeYearsCombined = true
  const since = getStartDate(code, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)
  const settings = { includeAllSpecials, includeGraduated }
  let facultyTableStats = getYearsObject({ years, emptyArrays: true })
  let programmeTableStats = {}

  for (const year of years.reverse()) {
    const queryParams = { programmes, since, settings, year, years, programmeTableStats }
    const totals = await getFacultyDataForYear(queryParams)
    facultyTableStats[year] = [
      year,
      totals.total,
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
    years: years,
    facultyTableStats: facultyTableStats,
    programmeStats: programmeTableStats,
    titles: tableTitles['studytracks'],
    programmeNames: programmes.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
  }
  return studentsData
}

module.exports = { combineFacultyStudents }
