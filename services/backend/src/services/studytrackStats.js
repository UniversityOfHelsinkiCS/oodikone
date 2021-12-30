const { indexOf } = require('lodash')

const { getAssociations } = require('./studyrights')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const {
  getStartDate,
  getYearsArray,
  getPercentage,
  getCreditGraphStats,
  getYearsObject,
} = require('./studyprogrammeHelpers')
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

const getStudytrackDataForTheYear = async ({
  studyprogramme,
  studytracks,
  studytrackNames,
  year,
  years,
  mainStatsByTrack,
  mainStatsByYear,
  creditTableStats,
  creditGraphStats,
  emptyTracks,
}) => {
  const { startDate, endDate } = getAcademicYearDates(year)

  await Promise.all(
    studytracks.map(async track => {
      const codes = studyprogramme === track ? [studyprogramme] : [studyprogramme, track]
      const studentnumbers = await studentnumbersWithAllStudyrightElements(
        codes,
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

      if (started.length === 0) {
        emptyTracks.has(track) ? emptyTracks.set(track, emptyTracks.get(track) + 1) : emptyTracks.set(track, 1)
        return
      }

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

      mainStatsByTrack[track] = [
        ...mainStatsByTrack[track],
        [
          `${year} - ${year + 1}`,
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
      ]

      mainStatsByYear[year] = [
        ...mainStatsByYear[year],
        [
          studytrackNames[track]?.name['fi'] || `${year} - ${year + 1}`,
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
      ]
    })
  )
}

const getStudytrackNames = (studytrackNames, studytracks, emptyTracks, years) => {
  const names = {}
  studytracks.forEach(track => {
    const trackName = studytrackNames[track]?.name['fi']
    if (trackName && emptyTracks.get(track) !== years.length) {
      names[track] = trackName
    }
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

  const studytrackNames = associations.studyTracks

  const mainStatsByTrack = {}
  const creditGraphStats = {}
  const creditTableStats = {}
  const mainStatsByYear = getYearsObject(years, true)

  studytracks.forEach(async track => {
    mainStatsByTrack[track] = []
    creditGraphStats[track] = await getCreditGraphStats(years)
    creditTableStats[track] = []
  })

  const emptyTracks = new Map()

  await Promise.all(
    years.map(async year => {
      return await getStudytrackDataForTheYear({
        studyprogramme,
        studytracks,
        studytrackNames,
        year,
        years,
        mainStatsByTrack,
        mainStatsByYear,
        creditGraphStats,
        creditTableStats,
        emptyTracks,
      })
    })
  )

  const studytrackOptions = getStudytrackNames(studytrackNames, studytracks, emptyTracks, years)

  return {
    id: studyprogramme,
    years: getYearsArray(since.getFullYear(), isAcademicYear),
    mainStatsByTrack,
    mainStatsByYear,
    creditTableStats,
    creditGraphStats,
    studytrackOptions,
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
