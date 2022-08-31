const moment = require('moment')
const { graduatedStudyrights, bachelorStudyright } = require('./faculty')
const { findRightProgramme, isNewProgramme } = require('./facultyHelpers')
const { getYearsArray, getYearsObject, getMean, getMedian, defineYear } = require('../studyprogrammeHelpers')

const findBachelorStartdate = async id => {
  const studyright = await bachelorStudyright(id)
  if (studyright) return studyright.studystartdate
  return null
}

const countGraduationTimes = async (faculty, programmeFilter) => {
  const isAcademicYear = false // = yearType === 'ACADEMIC_YEAR'
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
  // (times 2 to set goal time at the halfway point on graphs)
  const comparisonValues = {
    bachelor: 36 * 2,
    bcMsCombo: 60 * 2,
    master: 24 * 2,
    doctor: 48 * 2,
    // Fix differrent cases?
    licentiate: 78 * 2,
  }

  // To do:
  // Huomioi tavoiteaikaa kuluttavat ja kuluttamattomat poissaolot

  // We count studyrights (vs. studyright_elements)
  // This way we get the whole time for a degree, even if the student was transferred to a new programme
  // E.g. started 8/2016 in old Bc, transferred to new 10/2020, graduated from new 1/2021 --> total 53 months (not 3)

  const graduatedRights = await graduatedStudyrights(faculty, since)

  for (const right of graduatedRights) {
    const { enddate, studystartdate, studyrightid, extentcode, studyrightElements } = right
    const { programme } = findRightProgramme(studyrightElements, 'graduated')
    if (programmeFilter === 'NEW_STUDY_PROGRAMMES') {
      if (!isNewProgramme(programme)) continue
    }
    const graduationYear = defineYear(enddate, isAcademicYear)

    let absoluteTimeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')

    if (extentcode == 1) {
      // count bachelor
      graduationAmounts.bachelor[graduationYear] += 1
      graduationTimes.bachelor[graduationYear] = [...graduationTimes.bachelor[graduationYear], absoluteTimeToGraduation]
    } else if (extentcode === 2) {
      if (studyrightid.slice(-2) === '-2') {
        // Bachelor + master studyright
        const bcStartdate = await findBachelorStartdate(studyrightid.replace(/-2$/, '-1'))
        absoluteTimeToGraduation = moment(enddate).diff(moment(bcStartdate), 'months')
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
  }

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
