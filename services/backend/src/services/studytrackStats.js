const { indexOf } = require('lodash')
const moment = require('moment')

const { getAssociations } = require('./studyrights')
const {
  getMedian,
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
    if (thresholdKeys.length > 7) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] && creditcount < thresholdAmounts[6] ? 1 : 0
      data[thresholdKeys[7]] += creditcount >= thresholdAmounts[6] ? 1 : 0
    } else if (thresholdKeys.length > 6) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] ? 1 : 0
    } else if (thresholdKeys.length > 5) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] ? 1 : 0
    } else {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] ? 1 : 0
    }
  })
  return data
}

const getGraduationTimeStats = async ({ year, graduated, track, graduationAmounts, graduationTimes, classSize }) => {
  if (year === 'Total') {
    return
  }

  // Count how long each student took to graduate
  let times = []
  graduated.forEach(({ enddate, startdate }) => {
    const timeToGraduation = moment(enddate).diff(moment(startdate), 'months')
    graduationAmounts[track][year] += 1
    times = [...times, timeToGraduation]
  })

  const median = getMedian(times)
  const statistics = countTimeCategories(times, graduationTimes.goal)

  graduationTimes[track].medians = [
    ...graduationTimes[track].medians,
    { y: median, amount: graduationAmounts[track][year], name: year, statistics, classSize },
  ]
}

const getStats = (all, started, enrolled, absent, inactive, graduated, studentData) => {
  return [
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
  ]
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
    graduationAmounts,
    graduationTimes,
    totalAmounts,
    emptyTracks,
    totals,
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
      const students = await studytrackStudents(studentnumbers)

      let all = []
      let studentData = {}
      let started = []
      let enrolled = []
      let absent = []
      let inactive = []
      let graduated = []
      // Get all the studyrights and students for the calculations
      if (year !== 'Total') {
        all = await allStudyrights(track, studentnumbers)
        studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        started = await startedStudyrights(track, startDate, studentnumbers)
        enrolled = await enrolledStudents(track, startDate, studentnumbers)
        absent = await absentStudents(track, studentnumbers)
        inactive = await inactiveStudyrights(track, studentnumbers)
        graduated = await graduatedStudyRights(track, startDate, studentnumbers)
        totals[track].all = [...totals[track].all, ...all]
        totals[track].studentData.male += studentData.male
        totals[track].studentData.female += studentData.female
        totals[track].studentData.finnish += studentData.finnish
        totals[track].started = [...totals[track].started, ...started]
        totals[track].enrolled = [...totals[track].enrolled, ...enrolled]
        totals[track].absent = [...totals[track].absent, ...absent]
        totals[track].inactive = [...totals[track].inactive, ...inactive]
        totals[track].graduated = [...totals[track].graduated, ...graduated]
      } else {
        all = totals[track].all
        studentData = totals[track].studentData
        started = totals[track].started
        enrolled = totals[track].enrolled
        absent = totals[track].absent
        inactive = totals[track].inactive
        graduated = totals[track].graduated
      }

      // If the track has no stats for that year, it should be removed from the table and dropdown options
      if (all.length === 0) {
        emptyTracks.has(track) ? emptyTracks.set(track, emptyTracks.get(track) + 1) : emptyTracks.set(track, 1)
        return
      }

      if (year !== 'Total') {
        // Count stats for creditgraph for the year per track
        creditThresholdKeys.forEach(
          threshold => (creditGraphStats[track][threshold].data[indexOf(years, year)] += studentData[threshold])
        )
        creditThresholdKeys.forEach(
          threshold => (creditGraphStats[track][threshold].data[indexOf(years, 'Total')] += studentData[threshold])
        )
        // Count stats for the credit progress table for the year per track
        creditTableStats[track] = [
          [year, all.length, ...creditThresholdKeys.map(threshold => studentData[threshold])],
          ...creditTableStats[track],
        ]
      } else {
        const totalCredits = creditTableStats[track].reduce(
          (a, b) => a.map((colVal, idx) => colVal + (b[idx] || 0)),
          Array(creditThresholdKeys.length + 2).fill(0)
        )
        creditTableStats[track] = [[year, ...totalCredits.slice(1)], ...creditTableStats[track]]
      }

      // Count stats for the main studytrack table grouped by tracks
      mainStatsByTrack[track] = [
        [year, ...getStats(all, started, enrolled, absent, inactive, graduated, studentData)],
        ...mainStatsByTrack[track],
      ]

      // Count stats for the main studytrack table grouped by year
      mainStatsByYear[year] = [
        [
          studytrackNames[track]?.name['fi'] ? `${studytrackNames[track]?.name['fi']}, ${track}` : year,
          ...getStats(all, started, enrolled, absent, inactive, graduated, studentData),
        ],
        ...mainStatsByYear[year],
      ]

      // Count stats for the graduation time charts grouped by year
      if (!(track in graduationTimes)) {
        graduationTimes[track] = { medians: [] }
      }
      totalAmounts[track][year] = all.length
      await getGraduationTimeStats({
        year,
        graduated,
        track,
        graduationAmounts,
        graduationTimes,
        classSize: totalAmounts[track][year],
      })
    })
  )
  Object.keys(graduationTimes).forEach(track => {
    if (track !== 'goal') {
      const sortedMedians = graduationTimes[track].medians.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimes[track].medians = sortedMedians
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
  const graduationAmounts = {}
  const graduationTimes = { goal: getGoal(studyprogramme) }
  const totalAmounts = {}
  const emptyTracks = new Map()
  const totals = {}
  studytracks.forEach(async track => {
    mainStatsByTrack[track] = []
    creditGraphStats[track] = getCreditGraphStats(studyprogramme, years, true)
    creditTableStats[track] = []
    graduationAmounts[track] = getYearsObject({ years })
    totalAmounts[track] = getYearsObject({ years })
    totals[track] = {
      all: [],
      started: [],
      enrolled: [],
      absent: [],
      inactive: [],
      graduated: [],
      studentData: { male: 0, female: 0, finnish: 0 },
    }
  })

  return {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationAmounts,
    graduationTimes,
    totalAmounts,
    emptyTracks,
    totals,
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
  const { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(studyprogramme, true)

  const yearsReversed = [...years].reverse()

  for (const year of yearsReversed) {
    await getStudytrackDataForTheYear({
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
  }

  const studytrackOptions = getStudytrackOptions(studyprogramme, studytrackNames, studytracks, data.emptyTracks, years)
  if (studyprogramme.includes('MH')) {
    return {
      id: studyprogramme,
      years: years,
      ...data,
      studytrackOptions,
      includeGraduated: settings.graduated,
      populationTitles: tableTitles['studytracks'],
      creditTableTitles:
        studyprogramme === 'MH90_001'
          ? tableTitles['creditProgress']['bachelor']
          : tableTitles['creditProgress']['masterOnly'],
    }
  }
  return {
    id: studyprogramme,
    years: years,
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
