const { indexOf } = require('lodash')
const { mapToProviders } = require('../../util/utils')
const { thesisWriters, facultyOgranizationId } = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('../studyprogrammeHelpers')

const getFacultyThesisWriters = async ({ since, years, isAcademicYear, facultyProgrammes, code }) => {
  let programmeProviders = facultyProgrammes.reduce(
    (results, studyprogramme) => ({
      ...results,
      [mapToProviders([studyprogramme.code])[0]]: { ...studyprogramme },
    }),
    {}
  )

  const { id } = await facultyOgranizationId(code)
  const thesisTypes = [
    'urn:code:course-unit-type:bachelors-thesis',
    'urn:code:course-unit-type:masters-thesis',
    'urn:code:course-unit-type:doctors-thesis',
    'urn:code:course-unit-type:licentiate-thesis',
    'urn:code:course-unit-type:bachelors-thesis-seminar',
    'urn:code:course-unit-type:masters-thesis-seminar',
  ]
  const thesisCourseCodes = await thesisWriters(id, Object.keys(programmeProviders), since, thesisTypes)
  let bachelors = getStatsBasis(years)
  let masters = getStatsBasis(years)
  let doctors = getStatsBasis(years)
  let licentiates = getStatsBasis(years)
  let programmeCounts = {}
  let programmeNames = {}

  thesisCourseCodes.forEach(({ attainment_date, courseUnitType, organizations }) => {
    const thesisYear = defineYear(attainment_date, isAcademicYear)
    let programme = programmeProviders[organizations[0].code]
    if (!programme) {
      programme = organizations[0]
    }
    if (!(programme.code in programmeCounts)) {
      programmeCounts[programme.code] = {}
      Object.keys(bachelors.tableStats).forEach(year => (programmeCounts[programme.code][year] = [0, 0, 0, 0, 0]))
      programmeNames[programme.code] = programme.name
    }
    programmeCounts[programme.code][thesisYear][0] += 1

    if (courseUnitType === thesisTypes[0] || courseUnitType == thesisTypes[4]) {
      bachelors.graphStats[indexOf(years, thesisYear)] += 1
      bachelors.tableStats[thesisYear] += 1
      programmeCounts[programme.code][thesisYear][1] += 1
    } else if (courseUnitType === thesisTypes[1] || courseUnitType == thesisTypes[5]) {
      masters.graphStats[indexOf(years, thesisYear)] += 1
      masters.tableStats[thesisYear] += 1
      programmeCounts[programme.code][thesisYear][2] += 1
    } else if (courseUnitType === thesisTypes[2]) {
      doctors.graphStats[indexOf(years, thesisYear)] += 1
      doctors.tableStats[thesisYear] += 1
      programmeCounts[programme.code][thesisYear][3] += 1
    } else if (courseUnitType === thesisTypes[3]) {
      licentiates.graphStats[indexOf(years, thesisYear)] += 1
      licentiates.tableStats[thesisYear] += 1
      programmeCounts[programme.code][thesisYear][4] += 1
    }
  })
  if (
    bachelors.graphStats.every(year => year === 0) &&
    masters.graphStats.every(year => year === 0) &&
    doctors.graphStats.every(year => year === 0) &&
    licentiates.graphStats.every(year => year === 0)
  ) {
    return {
      bachelors: { graphStats: [], tableStats: {} },
      masters: { graphStats: [], tableStats: {} },
      doctors: { graphStats: [], tableStats: {} },
      licentiates: { graphStats: [], tableStats: {} },
      programmeCounts: {},
    }
  }

  return { bachelors, masters, doctors, licentiates, programmeCounts, programmeNames }
}

const getFacultyThesisWritersForStudyTrack = async (allThesisWriters, facultyProgrammes, code, isAcademicYear) => {
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { since, years, isAcademicYear, code, facultyProgrammes }
  const { bachelors, masters, doctors, licentiates, programmeCounts, programmeNames } = await getFacultyThesisWriters(
    queryParameters
  )

  allThesisWriters.years = years.map(year => year.toString())
  const reversedYears = years.reverse()
  allThesisWriters.tableStats = reversedYears.map(year => [
    year,
    bachelors.tableStats[year] + masters.tableStats[year] + doctors.tableStats[year] + licentiates.tableStats[year],
    bachelors.tableStats[year],
    masters.tableStats[year],
    doctors.tableStats[year],
    licentiates.tableStats[year],
  ])
  allThesisWriters.graphStats.push({ name: 'Bachelors', data: bachelors.graphStats })
  allThesisWriters.graphStats.push({ name: 'Masters', data: masters.graphStats })
  allThesisWriters.graphStats.push({ name: 'Doctors', data: doctors.graphStats })
  allThesisWriters.graphStats.push({ name: 'Others', data: licentiates.graphStats })

  Object.keys(programmeNames).forEach(programmeCode => {
    reversedYears.forEach(year => {
      if (programmeCode in programmeCounts) {
        if (!(programmeCode in allThesisWriters.programmeTableStats)) {
          allThesisWriters.programmeTableStats[programmeCode] = []
        }
        allThesisWriters.programmeTableStats[programmeCode].push([year, ...programmeCounts[programmeCode][year]])
      }
    })
  })

  allThesisWriters.programmeNames = programmeNames
}

const combineFacultyThesisWriters = async (allThesisWriters, facultyProgrammes, faculty, yearType) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR' ? true : false
  await getFacultyThesisWritersForStudyTrack(allThesisWriters, facultyProgrammes, faculty, isAcademicYear)

  return allThesisWriters
}

module.exports = { combineFacultyThesisWriters }
