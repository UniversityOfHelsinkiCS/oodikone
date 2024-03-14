const moment = require('moment')

const {
  getMedian,
  getStartDate,
  getYearsArray,
  getPercentage,
  getYearsObject,
  getCorrectStudentnumbers,
  tableTitles,
  getGoal,
} = require('./studyprogrammeHelpers')
const {
  allStudyrights,
  startedStudyrights,
  inactiveStudyrights,
  graduatedStudyRightsByStartDate,
  graduatedStudyRights,
} = require('./studyrightFinders')
const { getAcademicYearDates } = require('../../util/semester')
const { countTimeCategories, getStatutoryAbsences } = require('../graduationHelpers')
const { studytrackStudents, enrolledStudents, absentStudents } = require('./studentGetters')

const getUnique = studentnumbers => [...new Set(studentnumbers)]
const getStudentData = (startDate, students) => {
  const data = { female: 0, male: 0, otherUnkown: 0, finnish: 0, otherCountries: 0, otherCountriesCounts: {} }
  const creditCounts = []
  students.forEach(({ genderCode, homeCountryEn, credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isAfter(startDate))
      // eslint-disable-next-line no-return-assign
      .reduce((prev, curr) => (prev += curr.credits), 0)
    creditCounts.push(creditcount)

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
  })
  return { data, creditCounts }
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
      amount: graduationAmounts[track].combo[year],
      name: year,
      statistics: statisticsCombo,
      classSize,
    },
  ]

  graduationTimes[track].medians.basic = [
    ...graduationTimes[track].medians.basic,
    { y: median, amount: graduationAmounts[track].basic[year], name: year, statistics, classSize },
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
  doCombo,
}) => {
  const { specialGroups: includeAllSpecials, graduated: includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)

  const {
    mainStatsByYear,
    mainStatsByTrack,
    graduationAmounts,
    graduationTimes,
    graduationTimesSecondProg,
    graduationAmountsSecondProg,
    totalAmounts,
    emptyTracks,
    totals,
    otherCountriesCount,
    creditCounts,
  } = data

  await Promise.all(
    studytracks.map(async track => {
      const codes = studyprogramme === track ? [studyprogramme] : [studyprogramme, track]
      const studentnumbers = await getCorrectStudentnumbers({
        codes,
        startDate,
        endDate,
        includeAllSpecials,
        includeTransferredTo: includeAllSpecials,
        includeGraduated,
      })

      const startedStudentnumbers = await getCorrectStudentnumbers({
        codes,
        startDate,
        endDate,
        includeAllSpecials,
        includeTransferredTo: false,
        includeGraduated,
      })
      const students = await studytrackStudents(studentnumbers)

      let all = []
      let studentData = {}
      let creditCountData = []
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
        ;({ data: studentData, creditCounts: creditCountData } = getStudentData(startDate, students))
        otherCountriesCount[track][year] = studentData.otherCountriesCounts
        started = await startedStudyrights(track, startDate, startedStudentnumbers)
        enrolled = await enrolledStudents(track, studentnumbers)
        absent = await absentStudents(track, studentnumbers)
        inactive = await inactiveStudyrights(track, studentnumbers)
        graduated = await graduatedStudyRights(track, startDate, studentnumbers)
        creditCounts[year] = creditCountData

        const enrolledSecondProgramme = combinedProgramme
          ? await enrolledStudents(combinedProgramme, studentnumbers)
          : []
        const absentSecondProgramme = combinedProgramme ? await absentStudents(combinedProgramme, studentnumbers) : []
        const inactiveSecondProgramme = combinedProgramme
          ? await inactiveStudyrights(combinedProgramme, studentnumbers)
          : []
        // Studentnumbers are fetched based on studystartdate, if it is greater than startdate
        // Thus, computing the bc+ms graduated by startdate based on these studentnumbers does not work.
        graduatedByStartdate = await graduatedStudyRightsByStartDate(track, startDate, endDate, false)
        if (combinedProgramme) {
          enrolled = getUnique([...enrolled, ...enrolledSecondProgramme].map(student => student.studentnumber))
          absent = getUnique([...absent, ...absentSecondProgramme].map(student => student.studentnumber))
          inactive = getUnique([...inactive, ...inactiveSecondProgramme].map(student => student.studentnumber))
          graduatedSecondProg = await graduatedStudyRights(combinedProgramme, startDate, studentnumbers)
          graduatedByStartSecondProg = await graduatedStudyRightsByStartDate(
            combinedProgramme,
            startDate,
            endDate,
            true
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

        otherCountriesCount[track].Total = countryStatsFromYears
      }

      // If the track has no stats for that year, it should be removed from the table and dropdown options
      if (all.length === 0) {
        // eslint-disable-next-line no-unused-expressions
        emptyTracks.has(track) ? emptyTracks.set(track, emptyTracks.get(track) + 1) : emptyTracks.set(track, 1)
        return
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
          studytrackNames[track]?.name.fi ? `${studytrackNames[track]?.name.fi}, ${track}` : year,
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
  const data = { ...getEmptyStatsObjects(years, studytracks, studyprogramme, combinedProgramme), creditCounts: {} }
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
    years,
    ...data,
    doCombo,
    studytrackOptions,
    includeGraduated: settings.graduated,
    populationTitles: [...tableTitles.studytracksStart, ...graduatedTitles, ...tableTitles.studytracksEnd],
  }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
