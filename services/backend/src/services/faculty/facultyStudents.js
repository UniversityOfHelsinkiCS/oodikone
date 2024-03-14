const {
  getStartDate,
  getYearsArray,
  getPercentage,
  getYearsObject,
  tableTitles,
} = require('../studyprogramme/studyprogrammeHelpers')
const { getAcademicYearDates } = require('../../util/semester')
const { getStudyRightsByExtent, getStudentsByStudentnumbers, getTransfersIn } = require('./faculty')
const { checkTransfers } = require('./facultyHelpers')
const { inactiveStudyrights, graduatedStudyRights } = require('../studyprogramme/studyrightFinders')
const { enrolledStudents, absentStudents } = require('../studyprogramme/studentGetters')

const emptyTotals = () => {
  return {
    total: 0,
    allStarted: 0,
    allEnrolled: 0,
    allAbsent: 0,
    allInactive: 0,
    allGraduated: 0,
    allFinnish: 0,
    allFemale: 0,
    allMale: 0,
    allOtherUnknown: 0,
    allOtherCountries: 0,
  }
}
const totalsCalculation = totals => {
  return [
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
    totals.allOtherUnknown,
    getPercentage(totals.allOtherUnknown, totals.total),
    totals.allFinnish,
    getPercentage(totals.allFinnish, totals.total),
    totals.allOtherCountries,
    getPercentage(totals.allOtherCountries, totals.total),
  ]
}
const addTotals = (facultyTableStats, year, totals) => {
  facultyTableStats[year] = [year, ...totalsCalculation(totals)]
}
const addTotalsProgramme = (programmeTableStats, progId, year, totals) => {
  programmeTableStats[progId][year] = totalsCalculation(totals)
}

const getStudentData = (students, facultyExtra, year, code) => {
  const data = { female: 0, male: 0, finnish: 0, otherCountries: 0, otherUnknown: 0 }
  students.forEach(({ genderCode, homeCountryEn }) => {
    data.male += genderCode === '1' ? 1 : 0
    data.female += genderCode === '2' ? 1 : 0
    data.otherUnknown += ['0', '3'].includes(genderCode) ? 1 : 0
    data.finnish += homeCountryEn === 'Finland' ? 1 : 0
    data.otherCountries += homeCountryEn !== 'Finland' ? 1 : 0
    if (!Object.keys(facultyExtra[year][code]).includes(homeCountryEn) && homeCountryEn !== 'Finland')
      facultyExtra[year][code][homeCountryEn] = 0
    if (!Object.keys(facultyExtra.Total[code]).includes(homeCountryEn) && homeCountryEn !== 'Finland')
      facultyExtra.Total[code][homeCountryEn] = 0
    if (homeCountryEn !== 'Finland') {
      facultyExtra[year][code][homeCountryEn] += 1
      facultyExtra.Total[code][homeCountryEn] += 1
    }
  })
  return data
}

// Goes through the faculty and its study programmes for the year
const getFacultyDataForYear = async ({
  faculty,
  programmes,
  since,
  settings,
  year,
  years,
  programmeTableStats,
  facultyExtra,
  allTotals,
  progTotals,
  programmeNames,
}) => {
  const { includeAllSpecials, includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)
  // Totals for the year into table stats
  let extents = [1, 2, 3, 4]
  let graduated = [0]
  if (includeAllSpecials) {
    extents = [...extents, ...[6, 7, 9, 13, 14, 18, 22, 23, 34, 99]] // 16 is always excluded
  }
  if (includeGraduated) {
    graduated = [...graduated, 1]
  }
  const totals = emptyTotals()
  for (const { progId, code, name } of programmes) {
    if (!Object.keys(facultyExtra[year]).includes(code)) facultyExtra[year][code] = {}
    if (!Object.keys(facultyExtra.Total).includes(code)) facultyExtra.Total[code] = {}

    const toTransfers = await getTransfersIn(code, startDate, endDate)
    const allStudyrights = await getStudyRightsByExtent(faculty, startDate, endDate, code, extents, graduated)
    let allStudents = []
    if (includeAllSpecials) {
      allStudents = [...new Set([...allStudyrights.map(sr => sr.studentnumber)])]
    }
    const studyrights = allStudyrights.filter(s => !checkTransfers(s, toTransfers, toTransfers))

    // Get all the studyrights and students for the calculations
    const studentNbrs = studyrights.map(sr => sr.studentnumber)
    allStudents = [...new Set([...studentNbrs, ...allStudents])]
    const students = await getStudentsByStudentnumbers(allStudents)
    const studentData = getStudentData(students, facultyExtra, year, code)
    const started = [...new Set(studentNbrs)]
    const inactive = await inactiveStudyrights(code, allStudents)
    const graduatedStudents = await graduatedStudyRights(code, startDate, allStudents)
    const absent = await absentStudents(code, allStudents)
    const enrolled = await enrolledStudents(code, allStudents)
    // Count stats for the programme
    if (allStudents.length === 0) continue
    if (!(progId in programmeTableStats)) {
      programmeTableStats[progId] = years.reduce((resultObj, yearKey) => {
        return { ...resultObj, [yearKey]: [] }
      }, {})
      progTotals[progId] = emptyTotals()
    }
    if (!(progId in programmeNames)) {
      programmeNames[progId] = { code, ...name }
      progTotals[progId] = emptyTotals()
    }

    const yearTotals = {
      total: students.length,
      allStarted: started.length,
      allEnrolled: enrolled.length,
      allAbsent: absent.length,
      allInactive: inactive.length,
      allGraduated: graduatedStudents.length,
      allMale: studentData.male,
      allFemale: studentData.female,
      allOtherUnknown: studentData.otherUnknown,
      allFinnish: studentData.finnish,
      allOtherCountries: studentData.otherCountries,
    }
    addTotalsProgramme(programmeTableStats, progId, year, yearTotals)

    totals.total += students.length
    totals.allStarted += started.length
    totals.allEnrolled += enrolled.length
    totals.allAbsent += absent.length
    totals.allInactive += inactive.length
    totals.allGraduated += graduatedStudents.length
    totals.allFemale += studentData.female
    totals.allMale += studentData.male
    totals.allOtherUnknown += studentData.otherUnknown
    totals.allFinnish += studentData.finnish
    totals.allOtherCountries += studentData.otherCountries

    allTotals.total += students.length
    allTotals.allStarted += started.length
    allTotals.allEnrolled += enrolled.length
    allTotals.allAbsent += absent.length
    allTotals.allInactive += inactive.length
    allTotals.allGraduated += graduatedStudents.length
    allTotals.allFemale += studentData.female
    allTotals.allMale += studentData.male
    allTotals.allOtherUnknown += studentData.otherUnknown
    allTotals.allFinnish += studentData.finnish
    allTotals.allOtherCountries += studentData.otherCountries

    progTotals[progId].total += students.length
    progTotals[progId].allStarted += started.length
    progTotals[progId].allEnrolled += enrolled.length
    progTotals[progId].allAbsent += absent.length
    progTotals[progId].allInactive += inactive.length
    progTotals[progId].allGraduated += graduatedStudents.length
    progTotals[progId].allFemale += studentData.female
    progTotals[progId].allMale += studentData.male
    progTotals[progId].allOtherUnknown += studentData.otherUnknown
    progTotals[progId].allFinnish += studentData.finnish
    progTotals[progId].allOtherCountries += studentData.otherCountries
  }
  return totals
}

// Combines all the data for faculty students table
const combineFacultyStudents = async (code, programmes, specialGroups, graduated) => {
  // Only academic years are considered
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const since = getStartDate(code, true)
  const years = getYearsArray(since.getFullYear(), true, true)
  const settings = { includeAllSpecials, includeGraduated }
  const facultyTableStats = getYearsObject({ years, emptyArrays: true })
  const programmeTableStats = {}
  const facultyExtra = years.reduce((acc, year) => ({ ...acc, [year]: {} }), {})
  const progTotals = {}
  const allTotals = emptyTotals()
  const programmeNames = {}
  for (const year of years.reverse()) {
    if (year === 'Total') continue
    const queryParams = {
      faculty: code,
      programmes,
      since,
      settings,
      year,
      years,
      programmeTableStats,
      facultyExtra,
      allTotals,
      progTotals,
      programmeNames,
    }
    const totals = await getFacultyDataForYear(queryParams)
    addTotals(facultyTableStats, year, totals)
  }

  addTotals(facultyTableStats, 'Total', allTotals)
  Object.keys(progTotals).forEach(programme =>
    addTotalsProgramme(programmeTableStats, programme, 'Total', progTotals[programme])
  )

  const studentsData = {
    id: code,
    years,
    facultyTableStats,
    facultyTableStatsExtra: facultyExtra,
    programmeStats: programmeTableStats,
    titles: [...tableTitles.studytracksStart, ...tableTitles.studytracksBasic, ...tableTitles.studytracksEnd],
    programmeNames,
  }
  return studentsData
}

module.exports = { combineFacultyStudents }
