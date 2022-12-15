const moment = require('moment')
const { Op } = require('sequelize')
const { getStartDate, getYearsArray, getPercentage, getYearsObject, tableTitles } = require('../studyprogrammeHelpers')
const { getAcademicYearDates } = require('../../util/semester')
const {
  getStudyRightsByExtent,
  getStudentsByStudentnumbers,
  getTransferredToAndAway,
  getTransferredInside,
} = require('./faculty')
const { getCurrentSemester } = require('../semesters')
const { checkTransfers } = require('./facultyHelpers')

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
const getFacultyDataForYear = async ({
  faculty,
  programmes,
  allProgrammeCodes,
  since,
  settings,
  year,
  years,
  programmeTableStats,
}) => {
  const { includeAllSpecials, includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)

  // Totals for the year into table stats
  let extents = [1, 2, 3, 4]
  let graduated = [0]
  if (includeAllSpecials) {
    extents = [...extents, ...[7, 9, 34, 22, 99, 14, 13]]
  }
  if (includeGraduated) {
    graduated = [...graduated, 1]
  }
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
  const programmeCodes = programmes.map(pr => pr.code)
  const start = moment('2017-08-01', 'YYYY-MM-DD')
  const toAndAwayTransfers = await getTransferredToAndAway(programmeCodes, allProgrammeCodes, start)
  const insideTransfers = await getTransferredInside(programmeCodes, allProgrammeCodes, start)
  for (const { progId, code } of programmes) {
    let elementStart = {}
    let studyrightStart = {}
    const startDateWhere = {
      startdate: {
        [Op.and]: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
    }
    if (code.includes('MH')) {
      elementStart = startDateWhere
    } else {
      studyrightStart = startDateWhere
    }
    const allStudyrights = await getStudyRightsByExtent(
      faculty,
      elementStart,
      studyrightStart,
      code,
      extents,
      graduated
    )
    let studyrights = allStudyrights
    if (!includeAllSpecials) {
      studyrights = allStudyrights.filter(s => !checkTransfers(s, insideTransfers, toAndAwayTransfers))
    }
    // Get all the studyrights and students for the calculations
    const currentSemester = await getCurrentSemester()
    const studentNbrs = studyrights.map(sr => sr.studentnumber)

    const students = await getStudentsByStudentnumbers(studentNbrs)
    const studentData = getStudentData(students)
    const started = students
    const inactive = studyrights.filter(
      s => s.graduated === 0 && (s.active === 0 || (s.enddate && moment(s.enddate).isBefore(moment(new Date()))))
    )
    const graduatedStudents = studyrights.filter(sr => sr.graduated === 1)
    const graduatedStudentNbrs = graduatedStudents.map(sr => sr.studentnumber)
    const absent = students.filter(
      s =>
        !graduatedStudentNbrs.includes(s.studentnumber) &&
        s.semesters.filter(semester => semester.semestercode === currentSemester.semestercode)[0]?.enrollmenttype === 2
    )
    const enrolled = students.filter(
      s =>
        s.semesters.filter(semester => semester.semestercode === currentSemester.semestercode)[0]?.enrollmenttype === 1
    )
    // Count stats for the programme
    if (!(progId in programmeTableStats)) {
      programmeTableStats[progId] = years.reduce((resultObj, yearKey) => {
        return { ...resultObj, [yearKey]: [] }
      }, {})
    }

    programmeTableStats[progId][year] = [
      students.length,
      started.length,
      getPercentage(started.length, students.length),
      enrolled.length,
      getPercentage(enrolled.length, students.length),
      absent.length,
      getPercentage(absent.length, students.length),
      inactive.length,
      getPercentage(inactive.length, students.length),
      graduatedStudents.length,
      getPercentage(graduatedStudents.length, students.length),
      studentData.male,
      getPercentage(studentData.male, students.length),
      studentData.female,
      getPercentage(studentData.female, students.length),
      studentData.finnish,
      getPercentage(studentData.finnish, students.length),
    ]

    totals.total += students.length
    totals.allStarted += started.length
    totals.allEnrolled += enrolled.length
    totals.allAbsent += absent.length
    totals.allInactive += inactive.length
    totals.allGraduated += graduatedStudents.length
    totals.allFemale += studentData.female
    totals.allMale += studentData.male
    totals.allFinnish += studentData.finnish
  }
  return totals
}

// Combines all the data for faculty students table
const combineFacultyStudents = async (code, programmes, allProgrammeCodes, specialGroups, graduated) => {
  // Only academic years are considered
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const since = getStartDate(code, true)
  const years = getYearsArray(since.getFullYear(), true, true)
  const settings = { includeAllSpecials, includeGraduated }
  let facultyTableStats = getYearsObject({ years, emptyArrays: true })
  let programmeTableStats = {}

  for (const year of years.reverse()) {
    const queryParams = {
      faculty: code,
      programmes,
      allProgrammeCodes,
      since,
      settings,
      year,
      years,
      programmeTableStats,
    }
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
    programmeNames: programmes.reduce(
      (obj, dataItem) => ({ ...obj, [dataItem.progId]: { code: dataItem.code, ...dataItem.name } }),
      {}
    ),
  }
  return studentsData
}

module.exports = { combineFacultyStudents }
