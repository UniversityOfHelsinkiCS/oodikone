const { indexOf } = require('lodash')
const moment = require('moment')

const { getAssociations } = require('./studyrights')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const {
  getMedian,
  getMean,
  getStartDate,
  getYearsArray,
  getPercentage,
  getBachelorCreditGraphStats,
  getMasterCreditGraphStats,
  getYearsObject,
  getAcademicYearsObject,
  bachelorCreditThresholds,
  masterCreditThresholds,
  bachelorCreditAmounts,
  masterCreditAmounts,
} = require('./studyprogrammeHelpers')
const {
  studytrackStudents,
  allStudyrights,
  startedStudyrights,
  enrolledStudents,
  absentStudents,
  graduatedStudyRights,
} = require('./newStudyprogramme')
const { getAcademicYearDates } = require('../util/semester')

const getStudentData = (students, thresholdKeys, thresholdAmounts) => {
  let data = { female: 0, male: 0, finnish: 0 }
  thresholdKeys.forEach(t => (data[t] = 0))

  students.forEach(({ gender_code, home_country_en, creditcount }) => {
    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
    data[thresholdKeys[0]] += creditcount < thresholdAmounts[0] ? 1 : 0
    data[thresholdKeys[1]] += creditcount >= thresholdAmounts[0] && creditcount < thresholdAmounts[1] ? 1 : 0
    data[thresholdKeys[2]] += creditcount >= thresholdAmounts[1] && creditcount < thresholdAmounts[2] ? 1 : 0
    data[thresholdKeys[3]] += creditcount >= thresholdAmounts[2] && creditcount < thresholdAmounts[3] ? 1 : 0
    data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
    data[thresholdKeys[5]] += creditcount >= thresholdAmounts[5] ? 1 : 0
  })
  return data
}

const getGraduationTimeStats = async ({
  year,
  graduated,
  studyprogramme,
  track,
  graduationMeanTime,
  graduationMedianTime,
  graduationAmounts,
}) => {
  // Count how long each student took to graduate
  let graduationTimes = []
  graduated.forEach(({ enddate, studystartdate }) => {
    const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
    graduationAmounts[track][year] += 1
    graduationTimes = [...graduationTimes, timeToGraduation]
  })

  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studyprogramme.includes('KH') ? 72 : 48

  // HighCharts graph requires the data to have this format (ie. actual value, "empty value")
  const median = getMedian(graduationTimes)
  const mean = getMean(graduationTimes)
  graduationMedianTime[track][year] = [
    ['', median],
    ['', comparisonValue - median],
  ]
  graduationMeanTime[track][year] = [
    ['', mean],
    ['', comparisonValue - mean],
  ]
}

// Goes through the programme and all its studytracks for the said year and adds the wanted stats to the data objects
const getStudytrackDataForTheYear = async ({
  studyprogramme,
  special,
  graduatedIncluded,
  studytracks,
  studytrackNames,
  year,
  years,
  data,
  creditThresholdKeys,
  creditThresholdAmounts,
}) => {
  const {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationMeanTime,
    graduationMedianTime,
    graduationAmounts,
    emptyTracks,
  } = data
  const { startDate, endDate } = getAcademicYearDates(year)

  await Promise.all(
    studytracks.map(async track => {
      const codes = studyprogramme === track ? [studyprogramme] : [studyprogramme, track]
      const filterGraduated = graduatedIncluded ? false : true
      let studentnumbers = []
      if (special) {
        studentnumbers = await studentnumbersWithAllStudyrightElements(
          codes,
          startDate,
          endDate,
          true,
          true,
          true,
          true,
          null,
          false,
          filterGraduated
        )
      } else {
        studentnumbers = await studentnumbersWithAllStudyrightElements(
          codes,
          startDate,
          endDate,
          false,
          false,
          false,
          false,
          null,
          true,
          filterGraduated
        )
      }

      // Get all the studyrights and students for the calculations
      const all = await allStudyrights(track, null, studentnumbers)
      const students = await studytrackStudents(studentnumbers)
      const studentData = getStudentData(students, creditThresholdKeys, creditThresholdAmounts)
      const started = await startedStudyrights(track, startDate, studentnumbers)
      const enrolled = await enrolledStudents(track, startDate, studentnumbers)
      const absent = await absentStudents(track, studentnumbers)
      const cancelled = all.filter(s => s.canceldate !== null && s.canceldate !== undefined)
      const graduated = await graduatedStudyRights(track, null, studentnumbers)

      // If the track has no stats for that year, it should be removed from the table and dropdown options
      if (all.length === 0) {
        emptyTracks.has(track) ? emptyTracks.set(track, emptyTracks.get(track) + 1) : emptyTracks.set(track, 1)
        return
      }

      // Count stats for creditgraph for the year per track
      creditThresholdKeys.forEach(
        threshold => (creditGraphStats[track][threshold].data[indexOf(years, year)] = studentData[threshold])
      )
      // Count stats for the credit progress table for the year per track
      creditTableStats[track] = [
        ...creditTableStats[track],
        [`${year} - ${year + 1}`, all.length, ...creditThresholdKeys.map(threshold => studentData[threshold])],
      ]

      // Count stats for the main studytrack table grouped by tracks
      mainStatsByTrack[track] = [
        ...mainStatsByTrack[track],
        [
          `${year} - ${year + 1}`,
          all.length,
          getPercentage(all.length, all.length),
          started.length,
          getPercentage(started.length, all.length),
          enrolled.length,
          getPercentage(enrolled.length, all.length),
          absent.length,
          getPercentage(absent.length, all.length),
          cancelled.length,
          getPercentage(cancelled.length, all.length),
          graduated.length,
          getPercentage(graduated.length, all.length),
          studentData.male,
          getPercentage(studentData.male, all.length),
          studentData.female,
          getPercentage(studentData.female, all.length),
          studentData.finnish,
          getPercentage(studentData.finnish, all.length),
        ],
      ]

      // Count stats for the main studytrack table grouped by year
      mainStatsByYear[year] = [
        ...mainStatsByYear[year],
        [
          studytrackNames[track]?.name['fi']
            ? `${studytrackNames[track]?.name['fi']}, ${track}`
            : `${year} - ${year + 1}`,
          all.length,
          getPercentage(all.length, all.length),
          started.length,
          getPercentage(started.length, all.length),
          enrolled.length,
          getPercentage(enrolled.length, all.length),
          absent.length,
          getPercentage(absent.length, all.length),
          cancelled.length,
          getPercentage(cancelled.length, all.length),
          graduated.length,
          getPercentage(graduated.length, all.length),
          studentData.male,
          getPercentage(studentData.male, all.length),
          studentData.female,
          getPercentage(studentData.female, all.length),
          studentData.finnish,
          getPercentage(studentData.finnish, all.length),
        ],
      ]

      // Count stats for the graduation time charts grouped by year
      await getGraduationTimeStats({
        year: `${year} - ${year + 1}`,
        graduated,
        studyprogramme,
        track,
        graduationMedianTime,
        graduationMeanTime,
        graduationAmounts,
      })
    })
  )
}

// Defines the studytrack names for the studytrack selector
// If the track has no stats for any year, it should be removed the dropdown options
const getStudytrackOptions = (studyprogramme, studytrackNames, studytracks, emptyTracks, years) => {
  const names = { [studyprogramme]: 'All students of the programme' }
  studytracks.forEach(track => {
    const trackName = studytrackNames[track]?.name['fi']
    if (trackName && emptyTracks.get(track) !== years.length) {
      names[track] = trackName
    }
  })
  return names
}

// Creates empty objects for each statistic type, which are then updated with the studytrack data
const getEmptyStatsObjects = (years, studytracks, studyprogramme) => {
  const mainStatsByYear = getYearsObject(years, true)
  const mainStatsByTrack = {}
  const creditGraphStats = {}
  const creditTableStats = {}
  const graduationMedianTime = {}
  const graduationMeanTime = {}
  const graduationAmounts = {}
  const emptyTracks = new Map()

  studytracks.forEach(async track => {
    mainStatsByTrack[track] = []
    creditGraphStats[track] = studyprogramme.includes('KH')
      ? getBachelorCreditGraphStats(years)
      : getMasterCreditGraphStats(years)
    creditTableStats[track] = []
    graduationMedianTime[track] = getAcademicYearsObject(years, true)
    graduationMeanTime[track] = getAcademicYearsObject(years, true)
    graduationAmounts[track] = getAcademicYearsObject(years)
  })

  return {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationMedianTime,
    graduationMeanTime,
    graduationAmounts,
    emptyTracks,
  }
}

// Combines all the data for the Populations and Studytracks -view
const getStudytrackStatsForStudyprogramme = async ({ studyprogramme, graduated, specialGroups }) => {
  const isAcademicYear = true
  const special = specialGroups === 'SPECIAL_INCLUDED'
  const graduatedIncluded = graduated === 'GRADUATED_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear())

  const associations = await getAssociations()
  const studytracks = associations.programmes[studyprogramme]
    ? [studyprogramme, ...associations.programmes[studyprogramme].studytracks]
    : [studyprogramme]

  const studytrackNames = associations.studyTracks

  const data = getEmptyStatsObjects(years, studytracks, studyprogramme)
  const creditThresholdKeys = studyprogramme.includes('KH') ? bachelorCreditThresholds : masterCreditThresholds
  const creditThresholdAmounts = studyprogramme.includes('KH') ? bachelorCreditAmounts : masterCreditAmounts

  await Promise.all(
    years.map(async year => {
      return await getStudytrackDataForTheYear({
        studyprogramme,
        special,
        graduatedIncluded,
        studytracks,
        studytrackNames,
        year,
        years,
        data,
        creditThresholdKeys,
        creditThresholdAmounts,
      })
    })
  )

  const studytrackOptions = getStudytrackOptions(studyprogramme, studytrackNames, studytracks, data.emptyTracks, years)

  return {
    id: studyprogramme,
    years: getYearsArray(since.getFullYear(), isAcademicYear),
    mainStatsByTrack: data.mainStatsByTrack,
    mainStatsByYear: data.mainStatsByYear,
    creditTableStats: data.creditTableStats,
    creditGraphStats: data.creditGraphStats,
    graduationMedianTime: graduated ? data.graduationMedianTime : null,
    graduationMeanTime: graduated ? data.graduationMeanTime : null,
    graduationAmounts: graduated ? data.graduationAmounts : null,
    studytrackOptions,
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
