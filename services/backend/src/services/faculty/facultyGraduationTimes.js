const moment = require('moment')
const { graduatedStudyrights } = require('./faculty')
const { getYearsArray, getYearsObject, getMean, getMedian, defineYear } = require('../studyprogrammeHelpers')
// const { findRightProgramme } = require('./facultyHelpers')

const countGraduationTimes = async faculty => {
  const isAcademicYear = true // = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const levels = ['bachelor', 'bcMsCombo', 'master', 'doctor', 'licentiate']

  let graduationAmounts = {}
  let graduationTimes = {}
  let medians = {}
  let means = {}

  levels.forEach(level => {
    graduationAmounts[level] = getYearsObject({ years })
    graduationTimes[level] = getYearsObject({ years, emptyArrays: true })
    medians[level] = getYearsObject({ years, emptyArrays: true })
    means[level] = getYearsObject({ years, emptyArrays: true })
  })

  // the max amount of months in the graph, depends on programme type
  // (+ plus some padding so that all overtime years don't look the same)
  const comparisonValues = {
    bachelor: 36 + 10,
    bcMsCombo: 72 + 10,
    master: 24 + 5,
    doctor: 48 + 10,
    // Fix differrent cases?
    licentiate: 78 + 10,
  }

  // To do:
  // Huomioi tavoiteaikaa kuluttavat ja kuluttamattomat poissaolot

  const graduatedRights = await graduatedStudyrights(faculty, since)

  graduatedRights.forEach(({ enddate, studystartdate, studyrightid, extentcode }) => {
    const graduationYear = defineYear(enddate, isAcademicYear)
    // const { programme, programmeName } = findRightProgramme(studyrightElements, 'graduated')
    const absoluteTimeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')

    if (extentcode == 1) {
      // count bachelor
      graduationAmounts.bachelor[graduationYear] += 1
      graduationTimes.bachelor[graduationYear] = [...graduationTimes.bachelor[graduationYear], absoluteTimeToGraduation]
    } else if (extentcode === 2) {
      if (studyrightid.slice(-2) === '-2') {
        // Bachelor + master studyright
        graduationAmounts.bcMsCombo[graduationYear] += 1
        graduationTimes.bcMsCombo[graduationYear] = [
          ...graduationTimes.bcMsCombo[graduationYear],
          absoluteTimeToGraduation,
        ]
      } else {
        // Just master studyright
        graduationAmounts.master[graduationYear] += 1
        graduationTimes.master[graduationYear] = [...graduationTimes.master[graduationYear], absoluteTimeToGraduation]
      }
    } else if (extentcode === 4) {
      // doctor
      graduationAmounts.doctor[graduationYear] += 1
      graduationTimes.doctor[graduationYear] = [...graduationTimes.doctor[graduationYear], absoluteTimeToGraduation]
    } else if (extentcode === 3) {
      // licentiate
      graduationAmounts.licentiate[graduationYear] += 1
      graduationTimes.licentiate[graduationYear] = [
        ...graduationTimes.licentiate[graduationYear],
        absoluteTimeToGraduation,
      ]
    }
  })

  // HighCharts graph require the data to have this format (ie. actual value, "empty value")
  years.forEach(year => {
    levels.forEach(level => {
      const median = getMedian(graduationTimes[level][year])
      const mean = getMean(graduationTimes[level][year])
      medians[level][year] = [
        ['', median],
        ['', comparisonValues[level] - median],
      ]
      means[level][year] = [
        ['', mean],
        ['', comparisonValues[level] - mean],
      ]
    })
  })

  return { medians, means, graduationAmounts, years, levels }
}

module.exports = { countGraduationTimes }
