const { indexOf } = require('lodash')
const moment = require('moment')

const { getAssociations } = require('./studyrights')
const {
  getMedian,
  getMean,
  getStartDate,
  getYearsArray,
  getPercentage,
  getYearsObject,
  getCorrectStudentnumbers,
  getCreditThresholds,
  getCreditGraphStats,
  tableTitles,
  getCreditProgressTableTitles,
  getGoal,
} = require('./studyprogrammeHelpers')
const {
  studytrackStudents,
  allStudyrights,
  startedStudyrights,
  inactiveStudyrights,
  enrolledStudents,
  absentStudents,
  graduatedStudyRights,
} = require('./studyprogramme')
const { getAcademicYearDates } = require('../util/semester')
const { countTimeCategories } = require('./graduationHelpers')

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts) => {
  let data = { female: 0, male: 0, finnish: 0 }
  thresholdKeys.forEach(t => (data[t] = 0))

  students.forEach(({ gender_code, home_country_en, credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isAfter(startDate))
      .reduce((prev, curr) => (prev += curr.credits), 0)

    data.male += gender_code === '1' ? 1 : 0
    data.female += gender_code === '2' ? 1 : 0
    data.finnish += home_country_en === 'Finland' ? 1 : 0
    data[thresholdKeys[0]] += creditcount < thresholdAmounts[0] ? 1 : 0
    data[thresholdKeys[1]] += creditcount >= thresholdAmounts[0] && creditcount < thresholdAmounts[1] ? 1 : 0
    data[thresholdKeys[2]] += creditcount >= thresholdAmounts[1] && creditcount < thresholdAmounts[2] ? 1 : 0
    data[thresholdKeys[3]] += creditcount >= thresholdAmounts[2] && creditcount < thresholdAmounts[3] ? 1 : 0
    data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
    data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
    // bachelor programme has more columns than master and doctoral programmes
    if (thresholdKeys.length > 7) {
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] && creditcount < thresholdAmounts[6] ? 1 : 0
      data[thresholdKeys[7]] += creditcount >= thresholdAmounts[6] ? 1 : 0
    } else {
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] ? 1 : 0
    }
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
  graduationTimes,
}) => {
  // Count how long each student took to graduate
  let times = []
  graduated.forEach(({ enddate, startdate }) => {
    const timeToGraduation = moment(enddate).diff(moment(startdate), 'months')
    graduationAmounts[track][year] += 1
    times = [...times, timeToGraduation]
  })

  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studyprogramme.includes('KH') ? 72 : 48

  // HighCharts graph requires the data to have this format (ie. actual value, "empty value")
  const median = getMedian(times)
  const mean = getMean(times)
  graduationMedianTime[track][year] = [
    ['', median],
    ['', comparisonValue - median],
  ]
  graduationMeanTime[track][year] = [
    ['', mean],
    ['', comparisonValue - mean],
  ]
  if (year === 'Total') {
    return
  }
  const statistics = countTimeCategories(times, graduationTimes.goal)
  graduationTimes[track].medians = [
    ...graduationTimes[track].medians,
    { y: median, amount: graduationAmounts[track][year], name: year, statistics },
  ]
  graduationTimes[track].means = [
    ...graduationTimes[track].means,
    { y: mean, amount: graduationAmounts[track][year], name: year, statistics },
  ]
  // console.log(track, year)
  // console.log(graduationTimes)
  // console.log(graduationTimes[track].medians)
}

// Goes through the programme and all its studytracks for the said year and adds the wanted stats to the data objects
const getStudytrackDataForTheYear = async ({
  studyprogramme,
  since,
  settings,
  studytracks,
  studytrackNames,
  year,
  years,
  data,
  creditThresholdKeys,
  creditThresholdAmounts,
}) => {
  const { specialGroups: includeAllSpecials, graduated: includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)

  const {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationMeanTime,
    graduationMedianTime,
    graduationAmounts,
    graduationTimes,
    totalAmounts,
    emptyTracks,
  } = data

  await Promise.all(
    studytracks.map(async track => {
      const codes = studyprogramme === track ? [studyprogramme] : [studyprogramme, track]

      const studentnumbers = await getCorrectStudentnumbers({
        codes,
        startDate,
        endDate,
        includeAllSpecials,
        includeGraduated,
      })

      // Get all the studyrights and students for the calculations
      const all = await allStudyrights(track, studentnumbers)
      const students = await studytrackStudents(studentnumbers)
      const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
      const started = await startedStudyrights(track, startDate, studentnumbers)
      const enrolled = await enrolledStudents(track, startDate, studentnumbers)
      const absent = await absentStudents(track, studentnumbers)
      const inactive = await inactiveStudyrights(track, studentnumbers)
      const graduated = await graduatedStudyRights(track, startDate, studentnumbers)

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
        [year, all.length, ...creditThresholdKeys.map(threshold => studentData[threshold])],
      ]

      // Count stats for the main studytrack table grouped by tracks
      mainStatsByTrack[track] = [
        ...mainStatsByTrack[track],
        [
          year,
          all.length,
          getPercentage(all.length, all.length),
          started.length,
          getPercentage(started.length, all.length),
          enrolled.length,
          getPercentage(enrolled.length, all.length),
          absent.length,
          getPercentage(absent.length, all.length),
          inactive.length,
          getPercentage(inactive.length, all.length),
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
          studytrackNames[track]?.name['fi'] ? `${studytrackNames[track]?.name['fi']}, ${track}` : year,
          all.length,
          getPercentage(all.length, all.length),
          started.length,
          getPercentage(started.length, all.length),
          enrolled.length,
          getPercentage(enrolled.length, all.length),
          absent.length,
          getPercentage(absent.length, all.length),
          inactive.length,
          getPercentage(inactive.length, all.length),
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
      if (!(track in graduationTimes)) {
        graduationTimes[track] = { medians: [], means: [] }
      }
      totalAmounts[track][year] = await all.length
      await getGraduationTimeStats({
        year,
        graduated,
        studyprogramme,
        track,
        graduationMedianTime,
        graduationMeanTime,
        graduationAmounts,
        graduationTimes,
      })
    })
  )
  Object.keys(graduationTimes).forEach(track => {
    if (track !== 'goal') {
      const sortedMedians = graduationTimes[track].medians.sort((a, b) => b.name.localeCompare(a.name))
      const sortedMeans = graduationTimes[track].means.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimes[track].medians = sortedMedians
      graduationTimes[track].means = sortedMeans
    }
  })
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
  const mainStatsByYear = getYearsObject({ years, emptyArrays: true })
  const mainStatsByTrack = {}
  const creditGraphStats = {}
  const creditTableStats = {}
  const graduationMedianTime = {}
  const graduationMeanTime = {}
  const graduationAmounts = {}
  const graduationTimes = { goal: getGoal(studyprogramme) }
  const totalAmounts = {}
  const emptyTracks = new Map()

  studytracks.forEach(async track => {
    mainStatsByTrack[track] = []
    creditGraphStats[track] = getCreditGraphStats(studyprogramme, years)
    creditTableStats[track] = []
    graduationMedianTime[track] = getYearsObject({ years, emptyArrays: true })
    graduationMeanTime[track] = getYearsObject({ years, emptyArrays: true })
    graduationAmounts[track] = getYearsObject({ years })
    totalAmounts[track] = getYearsObject({ years })
  })

  return {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationMedianTime,
    graduationMeanTime,
    graduationAmounts,
    graduationTimes,
    totalAmounts,
    emptyTracks,
  }
}

// Combines all the data for the Populations and Studytracks -view
const getStudytrackStatsForStudyprogramme = async ({ studyprogramme, settings }) => {
  const isAcademicYear = true
  const includeYearsCombined = true
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  const associations = await getAssociations()
  const studytracks = associations.programmes[studyprogramme]
    ? [studyprogramme, ...associations.programmes[studyprogramme].studytracks]
    : [studyprogramme]

  const studytrackNames = associations.studyTracks

  const data = getEmptyStatsObjects(years, studytracks, studyprogramme)
  const { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(studyprogramme)

  await Promise.all(
    years.map(async year => {
      return await getStudytrackDataForTheYear({
        studyprogramme,
        since,
        settings,
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
    years: getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined),
    ...data,
    studytrackOptions,
    includeGraduated: settings.graduated,
    populationTitles: tableTitles['studytracks'],
    creditTableTitles: getCreditProgressTableTitles(studyprogramme),
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
