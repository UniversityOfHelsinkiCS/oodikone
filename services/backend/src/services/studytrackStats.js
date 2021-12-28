const moment = require('moment')
const { indexOf } = require('lodash')

const { getAssociations } = require('./studyrights')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { getStartDate, getYearsArray, getPercentage } = require('./studyprogrammeHelpers')
const { studytrackStudents, startedStudyrights, graduatedStudyRights } = require('./newStudyprogramme')
const { semesterStart, semesterEnd } = require('../util/semester')

const getStudentData = students => {
  const data = { female: 0, male: 0, finnish: 0, lte30: 0, lte60: 0, lte90: 0, lte120: 0, lte150: 0, mte150: 0 }
  students.forEach(({ gender_code, home_country_en, creditcount }) => {
    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
    data.lte30 += creditcount < 30 ? 1 : 0
    data.lte60 += creditcount >= 30 && creditcount < 60 ? 1 : 0
    data.lte90 += creditcount >= 60 && creditcount < 90 ? 1 : 0
    data.lte120 += creditcount >= 90 && creditcount < 120 ? 1 : 0
    data.lte150 += creditcount >= 120 && creditcount < 150 ? 1 : 0
    data.mte150 += creditcount >= 150 ? 1 : 0
  })
  return data
}

const getEmptyArray = length => new Array(length).fill(0)

const getCreditGraphStats = years => ({
  lte30: {
    name: 'Less than 30 credits',
    data: getEmptyArray(years.length),
  },
  lte60: {
    name: '30-59 credits',
    data: getEmptyArray(years.length),
  },
  lte90: {
    name: '60-89 credits',
    data: getEmptyArray(years.length),
  },
  lte120: {
    name: '90-119 credits',
    data: getEmptyArray(years.length),
  },
  lte150: {
    name: '120-149 credits',
    data: getEmptyArray(years.length),
  },
  mte150: {
    name: 'More than 150 credits',
    data: getEmptyArray(years.length),
  },
})

const getStudytrackDataForTheYear = async ({
  studyprogramme,
  studytracks,
  year,
  studytrackNames,
  years,
  creditGraphStats,
}) => {
  const startDate = `${year}-${semesterStart['FALL']}`
  const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`

  const data = await studytracks.reduce(
    async (all, track) => {
      const previousData = await all
      const codes = track === studyprogramme ? [studyprogramme] : [studyprogramme, track]
      const studentnumbers = await studentnumbersWithAllStudyrightElements(
        codes,
        startDate,
        endDate,
        true,
        true,
        true,
        true
      )
      const label = track === studyprogramme ? `${year} - ${year + 1}` : studytrackNames[track]
      const started = await startedStudyrights(track, startDate, studentnumbers)
      const startedStudentnumbers = [...new Set(started.map(s => s.studentnumber))]
      const students = await studytrackStudents(startedStudentnumbers)
      const studentData = getStudentData(students)
      const graduated = await graduatedStudyRights(track, startDate, studentnumbers)

      if (studyprogramme === track) {
        creditGraphStats.lte30.data[indexOf(years, year)] = studentData.lte30
        creditGraphStats.lte60.data[indexOf(years, year)] = studentData.lte60
        creditGraphStats.lte90.data[indexOf(years, year)] = studentData.lte90
        creditGraphStats.lte120.data[indexOf(years, year)] = studentData.lte120
        creditGraphStats.lte150.data[indexOf(years, year)] = studentData.lte150
        creditGraphStats.mte150.data[indexOf(years, year)] = studentData.mte150
      }

      if (started.length === 0) return previousData
      return {
        mainData: [
          ...previousData.mainData,
          [
            label,
            started.length,
            getPercentage(started.length, started.length),
            studentData.male,
            getPercentage(studentData.male, started.length),
            studentData.female,
            getPercentage(studentData.female, started.length),
            studentData.finnish,
            getPercentage(studentData.finnish, started.length),
            graduated.length,
            getPercentage(graduated.length, started.length),
          ],
        ],
        creditTableStats:
          track === studyprogramme
            ? [
                ...previousData.creditTableStats,
                [
                  label,
                  started.length,
                  studentData.lte30,
                  studentData.lte60,
                  studentData.lte90,
                  studentData.lte120,
                  studentData.lte150,
                  studentData.mte150,
                ],
              ]
            : previousData.creditTableStats,
      }
    },
    { mainData: [], creditTableStats: [] }
  )
  return data
}

const getStudytrackNames = (allStudytracks, programmesStudytracks) => {
  const names = {}
  programmesStudytracks.forEach(track => {
    const trackName = allStudytracks[track]?.name['fi']
    if (trackName) names[track] = `${trackName}, ${track}`
  })
  return names
}

const getStudytrackStatsForStudyprogramme = async ({ studyprogramme }) => {
  const isAcademicYear = true
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear())

  const associations = await getAssociations()
  const studytracks = associations.programmes[studyprogramme]
    ? [studyprogramme, ...associations.programmes[studyprogramme].studytracks]
    : [studyprogramme]

  const allStudytracks = associations.studyTracks
  const studytrackNames = getStudytrackNames(allStudytracks, studytracks)

  const creditGraphStats = await getCreditGraphStats(years)

  const data = await Promise.all(
    years.map(async year => {
      const dataOfYear = await getStudytrackDataForTheYear({
        studyprogramme,
        studytracks,
        year,
        studytrackNames,
        years,
        creditGraphStats,
      })
      return {
        year: `${year}-${year + 1}`,
        mainData: dataOfYear.mainData,
        creditTableStats: dataOfYear.creditTableStats,
      }
    })
  )

  return {
    id: studyprogramme,
    years: getYearsArray(since.getFullYear(), isAcademicYear),
    mainData: data.map(dataByYear => ({ year: dataByYear.year, data: dataByYear.mainData })).reverse(),
    creditTableStats: data.map(year => year.creditTableStats).reverse(),
    creditGraphStats: Object.values(creditGraphStats),
    studytrackNames: { studyprogramme: 'All students of the studyprogramme', ...studytrackNames },
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
