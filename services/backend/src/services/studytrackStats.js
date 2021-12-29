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

const getStudyprogrammeDataForTheYear = async ({ studyprogramme, year, years, creditTableStats, creditGraphStats }) => {
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

  creditGraphStats[studyprogramme].lte30.data[indexOf(years, year)] = studentData.lte30
  creditGraphStats[studyprogramme].lte60.data[indexOf(years, year)] = studentData.lte60
  creditGraphStats[studyprogramme].lte90.data[indexOf(years, year)] = studentData.lte90
  creditGraphStats[studyprogramme].lte120.data[indexOf(years, year)] = studentData.lte120
  creditGraphStats[studyprogramme].lte150.data[indexOf(years, year)] = studentData.lte150
  creditGraphStats[studyprogramme].mte150.data[indexOf(years, year)] = studentData.mte150

  creditTableStats[studyprogramme] = [
    ...creditTableStats[studyprogramme],
    [
      `${year} - ${year + 1}`,
      started.length,
      studentData.lte30,
      studentData.lte60,
      studentData.lte90,
      studentData.lte120,
      studentData.lte150,
      studentData.mte150,
    ],
  ]

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
  }
}

const getStudytrackDataForTheYear = async ({
  studyprogramme,
  studytracks,
  year,
  studytrackNames,
  years,
  creditTableStats,
  creditGraphStats,
}) => {
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
      const started = await startedStudyrights(track, startDate, studentnumbers)
      const startedStudentnumbers = [...new Set(started.map(s => s.studentnumber))]
      const students = await studytrackStudents(startedStudentnumbers)
      const studentData = getStudentData(students)
      const graduated = await graduatedStudyRights(track, startDate, studentnumbers)

      if (started.length === 0) return previousData

      creditGraphStats[track].lte30.data[indexOf(years, year)] = studentData.lte30
      creditGraphStats[track].lte60.data[indexOf(years, year)] = studentData.lte60
      creditGraphStats[track].lte90.data[indexOf(years, year)] = studentData.lte90
      creditGraphStats[track].lte120.data[indexOf(years, year)] = studentData.lte120
      creditGraphStats[track].lte150.data[indexOf(years, year)] = studentData.lte150
      creditGraphStats[track].mte150.data[indexOf(years, year)] = studentData.mte150

      creditTableStats[track] = [
        ...creditTableStats[track],
        [
          `${year} - ${year + 1}`,
          started.length,
          studentData.lte30,
          studentData.lte60,
          studentData.lte90,
          studentData.lte120,
          studentData.lte150,
          studentData.mte150,
        ],
      ]

      return {
        mainData: [
          ...previousData.mainData,
          [
            studytrackNames[track],
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
      }
    },
    { mainData: [] }
  )
  return data
}

const getStudytrackNames = (allStudytracks, programmesStudytracks) => {
  const names = {}
  programmesStudytracks.forEach(track => {
    const trackName = allStudytracks[track]?.name['fi']
    if (trackName) names[track] = trackName
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

  const creditGraphStats = {}
  const creditTableStats = {}

  studytracks.forEach(async track => {
    creditGraphStats[track] = await getCreditGraphStats(years)
    creditTableStats[track] = []
  })

  const data = await Promise.all(
    years.map(async year => {
      const programmeData = await getStudyprogrammeDataForTheYear({
        studyprogramme,
        year,
        years,
        creditGraphStats,
        creditTableStats,
      })
      const studytrackData = await getStudytrackDataForTheYear({
        studyprogramme,
        studytracks,
        year,
        studytrackNames,
        years,
        creditGraphStats,
        creditTableStats,
      })

      return {
        year: `${year}-${year + 1}`,
        mainData: [programmeData.mainData, ...studytrackData.mainData],
      }
    })
  )

  return {
    id: studyprogramme,
    years: getYearsArray(since.getFullYear(), isAcademicYear),
    mainData: data.map(dataByYear => ({ year: dataByYear.year, data: dataByYear.mainData })).reverse(),
    creditTableStats,
    creditGraphStats,
    studytrackNames: { [studyprogramme]: 'All students of the studyprogramme', ...studytrackNames },
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
