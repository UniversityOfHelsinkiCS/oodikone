const moment = require('moment')
const { Op } = require('sequelize')
const { getStartDate, getYearsArray, getPercentage, getYearsObject, tableTitles } = require('../studyprogrammeHelpers')
const { getAcademicYearDates } = require('../../util/semester')
const { getStudyRightsByExtent, getStudentsByStudentnumbers, getTransfers } = require('./faculty')
const { checkTransfers } = require('./facultyHelpers')
const { inactiveStudyrights, absentStudents, enrolledStudents } = require('../studyprogramme')
const { graduatedStudyRights } = require('../studyprogramme')
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
const toltalsCalculation = totals => {
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
  facultyTableStats[year] = [year, ...toltalsCalculation(totals)]
}
const addTotalsProgramme = (programmeTableStats, progId, year, totals) => {
  programmeTableStats[progId][year] = toltalsCalculation(totals)
}

const getStudentData = (students, facultyExtra, year, code) => {
  let data = { female: 0, male: 0, finnish: 0, otherCountries: 0, otherUnknown: 0 }
  students.forEach(({ gender_code, home_country_en }) => {
    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.otherUnknown += ['0', '3'].includes(gender_code) ? 1 : 0
    facultyExtra[year][code].otherG += gender_code === '3' ? 1 : 0
    facultyExtra[year][code].unknownG += gender_code === '0' ? 1 : 0
    facultyExtra['Total'][code].otherG += gender_code === '3' ? 1 : 0
    facultyExtra['Total'][code].unknownG += gender_code === '0' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
    data.otherCountries += home_country_en !== 'Finland' ? 1 : 0
    if (!Object.keys(facultyExtra[year][code].countries).includes(home_country_en))
      facultyExtra[year][code].countries[home_country_en] = 0
    if (!Object.keys(facultyExtra['Total'][code].countries).includes(home_country_en))
      facultyExtra['Total'][code].countries[home_country_en] = 0
    facultyExtra[year][code].countries[home_country_en] += 1
    facultyExtra['Total'][code].countries[home_country_en] += 1
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
    extents = [...extents, ...[7, 9, 34, 22, 99, 14, 13]]
  }
  if (includeGraduated) {
    graduated = [...graduated, 1]
  }
  const totals = emptyTotals()

  for (const { progId, code, name } of programmes) {
    let elementStart = {}
    let studyrightStart = {}
    const start = moment(`${year.slice(0, 4)}-08-01`, 'YYYY-MM-DD')
    const end = moment(`${year.slice(-4)}-07-31`, 'YYYY-MM-DD').endOf('day')
    const allTransfers = await getTransfers(code, allProgrammeCodes, start, end)
    if (!Object.keys(facultyExtra[year]).includes(code))
      facultyExtra[year][code] = { unknownG: 0, otherG: 0, countries: {} }
    if (!Object.keys(facultyExtra['Total']).includes(code))
      facultyExtra['Total'][code] = { unknownG: 0, otherG: 0, countries: {} }
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
    let allStudents = []

    studyrights = allStudyrights.filter(s => !checkTransfers(s, allTransfers, allTransfers))
    if (includeAllSpecials) {
      allStudents = [...new Set([...allTransfers.map(sr => sr.studentnumber).filter(student => student !== null)])]
    }
    // Get all the studyrights and students for the calculations
    const studentNbrs = studyrights.map(sr => sr.studentnumber)
    allStudents = [...studentNbrs, ...allStudents]
    const students = await getStudentsByStudentnumbers(allStudents)
    const studentData = getStudentData(students, facultyExtra, year, code)
    const started = await getStudentsByStudentnumbers(studentNbrs)
    const inactive = await inactiveStudyrights(code, allStudents)
    const graduatedStudents = await graduatedStudyRights(code, start, allStudents)
    const absent = await absentStudents(code, allStudents)
    const enrolled = await enrolledStudents(code, allStudents)
    // Count stats for the programme
    if (students.length === 0) continue
    if (!(progId in programmeTableStats)) {
      programmeTableStats[progId] = years.reduce((resultObj, yearKey) => {
        return { ...resultObj, [yearKey]: [] }
      }, {})
      progTotals[progId] = emptyTotals()
    }
    if (!(progId in programmeNames)) {
      programmeNames[progId] = { code: code, ...name }
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
const combineFacultyStudents = async (code, programmes, allProgrammeCodes, specialGroups, graduated) => {
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
      allProgrammeCodes,
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
    years: years,
    facultyTableStats: facultyTableStats,
    facultyTableStatsExtra: facultyExtra,
    programmeStats: programmeTableStats,
    titles: tableTitles['programmes'],
    programmeNames: programmeNames,
  }
  return studentsData
}

module.exports = { combineFacultyStudents }
