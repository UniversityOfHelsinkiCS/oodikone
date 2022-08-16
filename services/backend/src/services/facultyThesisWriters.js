const { indexOf } = require('lodash')
const { mapToProviders } = require('../util/utils')
const { thesisWriters } = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('./studyprogrammeHelpers')

const getFacultyThesisWriters = async ({ since, years, isAcademicYear, facultyProgrammes }) => {
  const providercodes = facultyProgrammes.map(studyProgramme => mapToProviders([studyProgramme.code])[0])
  const thesisTypes = [
    'urn:code:course-unit-type:bachelors-thesis',
    'urn:code:course-unit-type:masters-thesis',
    'urn:code:course-unit-type:doctors-thesis',
    'urn:code:course-unit-type:licentiate-thesis',
  ]
  const thesisCourseCodes = await thesisWriters(providercodes, since, thesisTypes)

  let bachelors = getStatsBasis(years)
  let masters = getStatsBasis(years)
  let doctors = getStatsBasis(years)
  // const programmeTableStats = {}

  thesisCourseCodes.forEach(({ attainment_date, courseUnitType }) => {
    const thesisYear = defineYear(attainment_date, isAcademicYear)

    if (courseUnitType === thesisTypes[0]) {
      bachelors.graphStats[indexOf(years, thesisYear)] += 1
      bachelors.tableStats[thesisYear] += 1
    } else if (courseUnitType === thesisTypes[1]) {
      masters.graphStats[indexOf(years, thesisYear)] += 1
      masters.tableStats[thesisYear] += 1
    } else if (courseUnitType === thesisTypes[2] || courseUnitType === thesisTypes[3]) {
      doctors.graphStats[indexOf(years, thesisYear)] += 1
      doctors.tableStats[thesisYear] += 1
    }
  })
  if (
    bachelors.graphStats.every(year => year === 0) &&
    masters.graphStats.every(year => year === 0) &&
    doctors.graphStats.every(year => year === 0)
  ) {
    return {
      bachelors: { graphStats: [], tableStats: {} },
      masters: { graphStats: [], tableStats: {} },
      doctors: { graphStats: [], tableStats: {} },
    }
  }
  return { bachelors, masters, doctors }
}

const getFacultyThesisWritersForStudyTrack = async (facultyProgrammes, code, isAcademicYear) => {
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const titles = [
    '',
    'All thesis writers',
    'Bachelors thesis writers',
    'Masters thesis writers',
    'Doctors/Licentiate thesis writers',
  ]
  const queryParameters = { code, since, years, isAcademicYear, facultyProgrammes }
  const { bachelors, masters, doctors } = await getFacultyThesisWriters(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const tableStats = reversedYears.map(year => [
    year,
    bachelors.tableStats[year] + masters.tableStats[year] + doctors.tableStats[year],
    bachelors.tableStats[year],
    masters.tableStats[year],
    doctors.tableStats[year],
  ])
  const graphStats = [
    {
      name: 'Bachelor thesis writers',
      data: bachelors.graphStats,
    },
    {
      name: 'Master thesis writers',
      data: masters.graphStats,
    },
    {
      name: 'Doctoral thesis writers',
      data: doctors.graphStats,
    },
  ]

  return {
    id: code,
    years,
    tableStats,
    graphStats,
    titles,
  }
}

const combineFacultyThesisWriters = async (allThesisWriters, facultyProgrammes, faculty, yearType) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR' ? true : false
  const data = await getFacultyThesisWritersForStudyTrack(facultyProgrammes, faculty, isAcademicYear)
  return data
}

module.exports = { combineFacultyThesisWriters, getFacultyThesisWritersForStudyTrack }
