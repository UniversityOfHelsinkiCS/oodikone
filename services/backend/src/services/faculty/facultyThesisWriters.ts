const { indexOf } = require('lodash')

const { serviceProvider } = require('../../conf-backend')
const { mapToProviders } = require('../../util/map')
const {
  alltimeEndDate,
  alltimeStartDate,
  defineYear,
  getCorrectStudentnumbers,
  getStatsBasis,
  getYearsArray,
} = require('../studyProgramme/studyProgrammeHelpers')
const { thesisWriters } = require('./faculty')

const getFacultyThesisWriters = async ({ since, years, isAcademicYear, facultyProgrammes, includeAllSpecials }) => {
  const bachelorsThesisTypes = ['urn:code:course-unit-type:bachelors-thesis']
  const mastersThesisTypes = ['urn:code:course-unit-type:masters-thesis']
  if (serviceProvider !== 'Toska') {
    bachelorsThesisTypes.push('urn:code:course-unit-type:amk-bachelors-thesis')
    mastersThesisTypes.push('urn:code:course-unit-type:amk-masters-thesis')
  }
  const thesisTypes = [
    ...bachelorsThesisTypes,
    ...mastersThesisTypes,
    'urn:code:course-unit-type:licentiate-thesis',
    'urn:code:course-unit-type:doctors-thesis',
  ]

  const bachelors = getStatsBasis(years)
  const masters = getStatsBasis(years)
  const programmeCounts = {}
  const programmeNames = {}

  for (const { progId, code, name } of facultyProgrammes) {
    if (code === 'MH70_008_2' || code.startsWith('LIS') || code.startsWith('T')) continue
    const provider = mapToProviders([code])[0]
    const students = await getCorrectStudentnumbers({
      codes: [code],
      startDate: alltimeStartDate,
      endDate: alltimeEndDate,
      includeAllSpecials,
      includeTransferredTo: includeAllSpecials,
    })

    const thesisCourseCodes = await thesisWriters(provider, since, thesisTypes, students)
    thesisCourseCodes?.forEach(({ attainment_date, courseUnitType }) => {
      const thesisYear = defineYear(attainment_date, isAcademicYear)

      if (!(progId in programmeCounts)) {
        programmeCounts[progId] = {}

        Object.keys(bachelors.tableStats).forEach(year => {
          programmeCounts[progId][year] = [0, 0, 0]
        })
        programmeNames[progId] = { ...name, code }
      }
      programmeCounts[progId][thesisYear][0] += 1

      if (bachelorsThesisTypes.includes(courseUnitType)) {
        bachelors.graphStats[indexOf(years, thesisYear)] += 1
        bachelors.tableStats[thesisYear] += 1
        programmeCounts[progId][thesisYear][1] += 1
      } else if (mastersThesisTypes.includes(courseUnitType)) {
        masters.graphStats[indexOf(years, thesisYear)] += 1
        masters.tableStats[thesisYear] += 1
        programmeCounts[progId][thesisYear][2] += 1
      }
    })
  }

  return { bachelors, masters, programmeCounts, programmeNames }
}

const getFacultyThesisWritersForProgrammes = async (
  allThesisWriters,
  facultyProgrammes,
  isAcademicYear,
  includeAllSpecials
) => {
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const queryParameters = { since, years, isAcademicYear, facultyProgrammes, includeAllSpecials }
  const { bachelors, masters, programmeCounts, programmeNames } = await getFacultyThesisWriters(queryParameters)

  allThesisWriters.years = years.map(year => year.toString())
  const reversedYears = years.reverse()
  allThesisWriters.tableStats = reversedYears.map(year => [
    year,
    bachelors.tableStats[year] + masters.tableStats[year],
    bachelors.tableStats[year],
    masters.tableStats[year],
  ])
  allThesisWriters.graphStats.push({ name: 'Bachelors', data: bachelors.graphStats })
  allThesisWriters.graphStats.push({ name: 'Masters', data: masters.graphStats })

  const programmes = programmeNames ? Object.keys(programmeNames) : facultyProgrammes.map(programme => programme.code)
  programmes.forEach(programmeId => {
    reversedYears.forEach(year => {
      if (programmeCounts && programmeId in programmeCounts) {
        if (!(programmeId in allThesisWriters.programmeTableStats)) {
          allThesisWriters.programmeTableStats[programmeId] = []
        }
        allThesisWriters.programmeTableStats[programmeId].push([year, ...programmeCounts[programmeId][year]])
      }
    })
  })

  allThesisWriters.programmeNames = programmeNames
}

const combineFacultyThesisWriters = async (faculty, facultyProgrammes, yearType, specialGroups) => {
  const allThesisWriters = {
    id: faculty,
    years: [],
    tableStats: [],
    graphStats: [],
    programmeTableStats: {},
    titles: ['', 'All', 'Bachelors', 'Masters'],
    programmeNames: {},
    status: 'Done',
    lastUpdated: '',
  }
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'

  await getFacultyThesisWritersForProgrammes(allThesisWriters, facultyProgrammes, isAcademicYear, includeAllSpecials)

  return allThesisWriters
}

module.exports = { combineFacultyThesisWriters }
