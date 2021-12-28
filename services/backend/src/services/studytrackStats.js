const { indexOf } = require('lodash')

const { getAssociations } = require('./studyrights')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { getStartDate, getYearsArray, getPercentage, getCreditGraphStats } = require('./studyprogrammeHelpers')
const { studytrackStudents, startedStudyrights, graduatedStudyRights } = require('./newStudyprogramme')
const { getAcademicYearDates } = require('../util/semester')

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

const getStudyprogrammeDataForTheYear = async ({ studyprogramme, year, years, creditGraphStats }) => {
  const { startDate, endDate } = getAcademicYearDates(year)

  const studentnumbers = await studentnumbersWithAllStudyrightElements(
    [studyprogramme],
    startDate,
    endDate,
    true,
    true,
    true,
    true
  )
  const label = `${year} - ${year + 1}`
  const started = await startedStudyrights(studyprogramme, startDate, studentnumbers)
  const startedStudentnumbers = [...new Set(started.map(s => s.studentnumber))]
  const students = await studytrackStudents(startedStudentnumbers)
  const studentData = getStudentData(students)
  const graduated = await graduatedStudyRights(studyprogramme, startDate, studentnumbers)

  creditGraphStats.lte30.data[indexOf(years, year)] = studentData.lte30
  creditGraphStats.lte60.data[indexOf(years, year)] = studentData.lte60
  creditGraphStats.lte90.data[indexOf(years, year)] = studentData.lte90
  creditGraphStats.lte120.data[indexOf(years, year)] = studentData.lte120
  creditGraphStats.lte150.data[indexOf(years, year)] = studentData.lte150
  creditGraphStats.mte150.data[indexOf(years, year)] = studentData.mte150

  return {
    mainData: [
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
    creditTableStats: [
      label,
      started.length,
      studentData.lte30,
      studentData.lte60,
      studentData.lte90,
      studentData.lte120,
      studentData.lte150,
      studentData.mte150,
    ],
  }
}

const getStudytrackDataForTheYear = async ({ studyprogramme, studytracks, year, studytrackNames }) => {
  const { startDate, endDate } = getAcademicYearDates(year)

  const data = await studytracks.reduce(
    async (all, track) => {
      const previousData = await all
      const studentnumbers = await studentnumbersWithAllStudyrightElements(
        [studyprogramme, track],
        startDate,
        endDate,
        true,
        true,
        true,
        true
      )
      const label = studytrackNames[track]
      const started = await startedStudyrights(track, startDate, studentnumbers)
      const startedStudentnumbers = [...new Set(started.map(s => s.studentnumber))]
      const students = await studytrackStudents(startedStudentnumbers)
      const studentData = getStudentData(students)
      const graduated = await graduatedStudyRights(track, startDate, studentnumbers)

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
        creditTableStats: [
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
        ],
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
      const programmeData = await getStudyprogrammeDataForTheYear({
        studyprogramme,
        year,
        years,
        creditGraphStats,
      })
      const studytrackData = await getStudytrackDataForTheYear({
        studyprogramme,
        studytracks,
        year,
        studytrackNames,
      })

      return {
        year: `${year}-${year + 1}`,
        mainData: [programmeData.mainData, ...studytrackData.mainData],
        creditTableStats: programmeData.creditTableStats,
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
