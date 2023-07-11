const { indexOf } = require('lodash')
const moment = require('moment')

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
  graduatedStudyRightsByStartDate,
  graduatedStudyRights,
} = require('./studyprogramme')
const { getAcademicYearDates } = require('../util/semester')
const { countTimeCategories, getStatutoryAbsences } = require('./graduationHelpers')

const getUnique = studentnumbers => [...new Set(studentnumbers)]
const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts) => {
  let data = { female: 0, male: 0, otherUnkown: 0, finnish: 0, otherCountries: 0, otherCountriesCounts: {} }
  thresholdKeys.forEach(t => (data[t] = 0))
  students.forEach(({ genderCode, homeCountryEn, credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isAfter(startDate))
      .reduce((prev, curr) => (prev += curr.credits), 0)

    data.male += genderCode === '1' ? 1 : 0
    data.female += genderCode === '2' ? 1 : 0
    data.otherUnkown += ['0', '3'].includes(genderCode) ? 1 : 0
    data.finnish += homeCountryEn === 'Finland' ? 1 : 0
    data.otherCountries += homeCountryEn !== 'Finland' ? 1 : 0
    if (homeCountryEn !== 'Finland') {
      if (!(homeCountryEn in data.otherCountriesCounts)) {
        data.otherCountriesCounts[homeCountryEn] = 0
      }
      data.otherCountriesCounts[homeCountryEn] += 1
    }
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
// type: either Bc + Ms combo or Bc/Ms/T/anything else
const addGraduation = async ({ studentNumber, startdate, enddate, graduationAmounts, times, track, type, year }) => {
  const totalTimeToGraduation = moment(enddate).diff(moment(startdate), 'months')
  const statutoryAbsences = await getStatutoryAbsences(studentNumber, startdate, enddate)
  const timeToGraduation = totalTimeToGraduation - statutoryAbsences
  graduationAmounts[track][type][year] += 1
  times[type] = [...times[type], timeToGraduation]
}

const getGraduationTimeStats = async ({
  year,
  graduated,
  track,
  graduationAmounts,
  graduationTimes,
  classSize,
  doCombo,
}) => {
  if (year === 'Total') {
    return
  }
  // Count how long each student took to graduate
  // Separate Bc + Ms and other
  const times = { combo: [], basic: [] }
  for (const { enddate, startdate, studyrightid, studentNumber } of graduated) {
    if (doCombo && studyrightid.slice(-2) === '-2') {
      await addGraduation({
        studentNumber,
        startdate,
        enddate,
        graduationAmounts,
        times,
        track,
        type: 'combo',
        year,
      })
    } else {
      await addGraduation({
        studentNumber,
        startdate,
        enddate,
        graduationAmounts,
        times,
        track,
        type: 'basic',
        year,
      })
    }
  }

  const median = getMedian(times.basic)
  const medianCombo = getMedian(times.combo)
  const statistics = countTimeCategories(times.basic, graduationTimes.goals.basic)
  const statisticsCombo = countTimeCategories(times.combo, graduationTimes.goals.combo)
  graduationTimes[track].medians.combo = [
    ...graduationTimes[track].medians.combo,
    {
      y: medianCombo,
      amount: graduationAmounts[track]['combo'][year],
      name: year,
      statistics: statisticsCombo,
      classSize,
    },
  ]

  graduationTimes[track].medians.basic = [
    ...graduationTimes[track].medians.basic,
    { y: median, amount: graduationAmounts[track]['basic'][year], name: year, statistics, classSize },
  ]
}

const getStats = (
  all,
  started,
  enrolled,
  absent,
  inactive,
  graduated,
  graduatedSecondProg,
  studentData,
  combinedProgramme
) => {
  const beginTablestats = [
    all.length,
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
  ]
  const combinedTableStats = combinedProgramme
    ? [graduatedSecondProg.length, getPercentage(graduatedSecondProg.length, all.length)]
    : []
  const endTableStats = [
    studentData.male,
    getPercentage(studentData.male, all.length),
    studentData.female,
    getPercentage(studentData.female, all.length),
    studentData.otherUnkown,
    getPercentage(studentData.otherUnkown, all.length),
    studentData.finnish,
    getPercentage(studentData.finnish, all.length),
    studentData.otherCountries,
    getPercentage(studentData.otherCountries, all.length),
  ]
  return [...beginTablestats, ...combinedTableStats, ...endTableStats]
}

// Goes through the programme and all its studytracks for the said year and adds the wanted stats to the data objects
const getStudytrackDataForTheYear = async ({
  studyprogramme,
  combinedProgramme,
  since,
  settings,
  studytracks,
  studytrackNames,
  year,
  years,
  data,
  creditThresholdKeys,
  creditThresholdAmounts,
  doCombo,
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
    graduationTimesSecondProg,
    graduationAmountsSecondProg,
    totalAmounts,
    emptyTracks,
    totals,
    otherCountriesCount,
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

      const startedStudentnumbers = await getCorrectStudentnumbers({
        codes,
        startDate,
        endDate,
        includeAllSpecials: false,
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
      let graduatedSecondProg = []
      let graduatedByStartdate = []
      let graduatedByStartSecondProg = []
      // Get all the studyrights and students for the calculations
      if (year !== 'Total') {
        all = await allStudyrights(track, studentnumbers)
        studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        otherCountriesCount[track][year] = studentData.otherCountriesCounts
        started = await startedStudyrights(track, startDate, startedStudentnumbers)
        enrolled = await enrolledStudents(track, studentnumbers)
        absent = await absentStudents(track, studentnumbers)
        inactive = await inactiveStudyrights(track, studentnumbers)
        graduated = await graduatedStudyRights(track, startDate, studentnumbers)

        const enrolledSecondProgramme = combinedProgramme
          ? await enrolledStudents(combinedProgramme, studentnumbers)
          : []
        const absentSecondProgramme = combinedProgramme ? await absentStudents(combinedProgramme, studentnumbers) : []
        const inactiveSecondProgramme = combinedProgramme
          ? await inactiveStudyrights(combinedProgramme, studentnumbers)
          : []
        // Studentnumbers are fetched based on studystartdate, if it is greater than startdate
        // Thus, computing the bc+ms graduated by startdate based on these studentnumbers does not work.
        const academicEnddate = `${year.slice(-4)}-07-31T23:59:59`
        graduatedByStartdate = await graduatedStudyRightsByStartDate(track, startDate, academicEnddate)
        if (combinedProgramme) {
          enrolled = getUnique([...enrolled, ...enrolledSecondProgramme].map(student => student.studentnumber))
          absent = getUnique([...absent, ...absentSecondProgramme].map(student => student.studentnumber))
          inactive = getUnique([...inactive, ...inactiveSecondProgramme].map(student => student.studentnumber))
          graduatedSecondProg = await graduatedStudyRights(combinedProgramme, startDate, studentnumbers)
          graduatedByStartSecondProg = await graduatedStudyRightsByStartDate(
            combinedProgramme,
            startDate,
            academicEnddate
          )
        }
        totals[track].all = [...totals[track].all, ...all]
        totals[track].studentData.male += studentData.male
        totals[track].studentData.female += studentData.female
        totals[track].studentData.otherUnkown += studentData.otherUnkown
        totals[track].studentData.finnish += studentData.finnish
        totals[track].studentData.otherCountries += studentData.otherCountries
        totals[track].started = [...totals[track].started, ...started]
        totals[track].enrolled = [...totals[track].enrolled, ...enrolled]
        totals[track].absent = [...totals[track].absent, ...absent]
        totals[track].inactive = [...totals[track].inactive, ...inactive]
        totals[track].graduated = [...totals[track].graduated, ...graduated]
        totals[track].graduatedSecondProg = [...totals[track].graduatedSecondProg, ...graduatedSecondProg]
      } else {
        all = totals[track].all
        studentData = totals[track].studentData
        started = totals[track].started
        enrolled = totals[track].enrolled
        absent = totals[track].absent
        inactive = totals[track].inactive
        graduated = totals[track].graduated
        graduatedSecondProg = totals[track].graduatedSecondProg
        const countryStatsFromYears = years.reduce((acc, year) => {
          if (year === 'Total') return acc
          const countries = otherCountriesCount[track][year]
          Object.keys(countries).forEach(country => {
            if (!(country in acc)) {
              acc[country] = 0
            }
            acc[country] += countries[country]
          })
          return acc
        }, {})

        otherCountriesCount[track]['Total'] = countryStatsFromYears
      }

      // If the track has no stats for that year, it should be removed from the table and dropdown options
      if (all.length === 0) {
        emptyTracks.has(track) ? emptyTracks.set(track, emptyTracks.get(track) + 1) : emptyTracks.set(track, 1)
        return
      }

      if (year !== 'Total') {
        // Count stats for creditgraph for the year per track
        creditThresholdKeys.forEach(threshold => {
          creditGraphStats[track][threshold].data[indexOf(years, year)] += studentData[threshold]
          creditGraphStats[track][threshold].data[indexOf(years, 'Total')] += studentData[threshold]
        })

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
        [
          year,
          ...getStats(
            all,
            started,
            enrolled,
            absent,
            inactive,
            graduated,
            graduatedSecondProg,
            studentData,
            combinedProgramme
          ),
        ],
        ...mainStatsByTrack[track],
      ]

      // Count stats for the main studytrack table grouped by year
      mainStatsByYear[year] = [
        [
          studytrackNames[track]?.name['fi'] ? `${studytrackNames[track]?.name['fi']}, ${track}` : year,
          ...getStats(
            all,
            started,
            enrolled,
            absent,
            inactive,
            graduated,
            graduatedSecondProg,
            studentData,
            combinedProgramme
          ),
        ],
        ...mainStatsByYear[year],
      ]

      // Count stats for the graduation time charts grouped by year
      if (!(track in graduationTimes)) {
        graduationTimes[track] = { medians: { basic: [], combo: [] } }
      }
      totalAmounts[track][year] = all.length
      await getGraduationTimeStats({
        year,
        graduated: graduatedByStartdate,
        track,
        graduationAmounts,
        graduationTimes,
        classSize: totalAmounts[track][year],
        doCombo,
      })
      if (combinedProgramme) {
        await getGraduationTimeStats({
          year,
          graduated: graduatedByStartSecondProg,
          track: combinedProgramme,
          graduationAmounts: graduationAmountsSecondProg,
          graduationTimes: graduationTimesSecondProg,
          classSize: totalAmounts[studyprogramme][year],
          doCombo: true,
        })
      }
    })
  )

  Object.keys(graduationTimes).forEach(track => {
    if (track !== 'goals') {
      const sortedMedians = graduationTimes[track].medians.basic.sort((a, b) => b.name.localeCompare(a.name))
      const sortedMediansCombo = graduationTimes[track].medians.combo.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimes[track].medians.basic = sortedMedians
      graduationTimes[track].medians.combo = sortedMediansCombo
    }
  })

  Object.keys(graduationTimesSecondProg).forEach(track => {
    if (track !== 'goals') {
      const sortedMedians = graduationTimesSecondProg[track].medians.combo.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimesSecondProg[track].medians.combo = sortedMedians
    }
  })
}

// Defines the studytrack names for the studytrack selector
// If the track has no stats for any year, it should be removed the dropdown options
const getStudytrackOptions = (studyprogramme, studytrackNames, studytracks, emptyTracks, years) => {
  const names = { [studyprogramme]: 'All students of the programme' }
  studytracks.forEach(track => {
    const trackName = studytrackNames[track]?.name
    if (trackName && emptyTracks.get(track) !== years.length) {
      names[track] = trackName
    }
  })
  return names
}

// Creates empty objects for each statistic type, which are then updated with the studytrack data
const getEmptyStatsObjects = (years, studytracks, studyprogramme, combinedProgramme) => {
  const mainStatsByYear = getYearsObject({ years, emptyArrays: true })
  const mainStatsByTrack = {}
  const creditGraphStats = {}
  const creditTableStats = {}
  const graduationAmounts = {}
  const goal = getGoal(studyprogramme)
  const goalSecondProg = getGoal(combinedProgramme)
  const graduationTimes = { goals: { basic: goal, combo: goal + 36 } }
  const graduationTimesSecondProg = {
    [combinedProgramme]: { medians: { basic: [], combo: [] } },
    goals: { basic: goal, combo: goal + goalSecondProg },
  }
  const otherCountriesCount = {}
  const graduationAmountsSecondProg = {
    [combinedProgramme]: { basic: getYearsObject({ years }), combo: getYearsObject({ years }) },
  }

  const totalAmounts = {}
  const emptyTracks = new Map()
  const totals = {}

  studytracks.forEach(async track => {
    otherCountriesCount[track] = {}
    mainStatsByTrack[track] = []
    creditGraphStats[track] = getCreditGraphStats(studyprogramme, years, combinedProgramme, true)
    creditTableStats[track] = []
    graduationAmounts[track] = { basic: getYearsObject({ years }), combo: getYearsObject({ years }) }
    totalAmounts[track] = getYearsObject({ years })
    totals[track] = {
      all: [],
      started: [],
      enrolled: [],
      absent: [],
      inactive: [],
      graduated: [],
      graduatedSecondProg: [],
      studentData: { male: 0, female: 0, otherUnkown: 0, finnish: 0, otherCountries: 0 },
    }
  })

  return {
    mainStatsByYear,
    mainStatsByTrack,
    creditGraphStats,
    creditTableStats,
    graduationAmounts,
    graduationTimes,
    graduationAmountsSecondProg,
    graduationTimesSecondProg,
    totalAmounts,
    emptyTracks,
    totals,
    otherCountriesCount,
  }
}

// Combines all the data for the Populations and Studytracks -view
// At the moment combined programme is thought to have only one track, the programme itself
const getStudytrackStatsForStudyprogramme = async ({ studyprogramme, combinedProgramme, settings, associations }) => {
  const isAcademicYear = true
  const includeYearsCombined = true
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  const studytracks = associations.programmes[studyprogramme]
    ? [studyprogramme, ...associations.programmes[studyprogramme].studytracks]
    : [studyprogramme]

  const studytrackNames = associations.studyTracks
  const data = getEmptyStatsObjects(years, studytracks, studyprogramme, combinedProgramme)
  const onlyMasterStudyrights = true

  const { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(
    studyprogramme,
    combinedProgramme,
    onlyMasterStudyrights
  )
  const doCombo = studyprogramme.startsWith('MH') && !['MH30_001', 'MH30_003'].includes(studyprogramme)
  const yearsReversed = [...years].reverse()
  for (const year of yearsReversed) {
    await getStudytrackDataForTheYear({
      studyprogramme,
      combinedProgramme,
      since,
      settings,
      studytracks,
      studytrackNames,
      year,
      years,
      data,
      creditThresholdKeys,
      creditThresholdAmounts,
      doCombo,
    })
  }

  const getCorrectCombinedTitles = () => {
    if (['MH90_001'].includes(combinedProgramme)) return tableTitles.studytracksCombined.licentiate
    return tableTitles.studytracksCombined.master
  }
  const studytrackOptions = getStudytrackOptions(studyprogramme, studytrackNames, studytracks, data.emptyTracks, years)
  const graduatedTitles = combinedProgramme ? getCorrectCombinedTitles() : tableTitles.studytracksBasic
  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years: years,
    ...data,
    doCombo,
    studytrackOptions,
    includeGraduated: settings.graduated,
    populationTitles: [...tableTitles.studytracksStart, ...graduatedTitles, ...tableTitles.studytracksEnd],
    creditTableTitles:
      studyprogramme === 'MH90_001'
        ? tableTitles['creditProgress']['bachelor']
        : getCreditProgressTableTitles(studyprogramme, combinedProgramme, true),
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
