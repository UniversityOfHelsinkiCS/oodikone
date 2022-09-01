const moment = require('moment')
const { graduatedStudyrights, bachelorStudyright, statutoryAbsences } = require('./faculty')
const { findRightProgramme, isNewProgramme } = require('./facultyHelpers')
const { getYearsArray, getYearsObject, getMean, getMedian, defineYear } = require('../studyprogrammeHelpers')

const findBachelorStartdate = async id => {
  const studyright = await bachelorStudyright(id)
  if (studyright) return studyright.studystartdate
  return null
}
const getStatutoryAbsences = async (studentnumber, startdate, enddate) => {
  const absences = await statutoryAbsences(studentnumber, startdate, enddate)
  if (absences.length) {
    const absentMonths = absences.reduce((sum, ab) => sum + moment(ab.end).diff(moment(ab.start), 'months'), 0)
    return absentMonths
  }
  return 0
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

  // We count studyrights (vs. studyright_elements)
  // This way we get the whole time for a degree, even if the student was transferred to a new programme
  // E.g. started 8/2016 in old Bc, transferred to new 10/2020, graduated from new 1/2021 --> total 53 months (not 3)

  const graduatedRights = await graduatedStudyrights(faculty, since)

  for (const right of graduatedRights) {
    const { enddate, startdate, studyrightid, extentcode, studyrightElements, studentnumber } = right
    const { programme } = findRightProgramme(studyrightElements, 'graduated')
    if (programmeFilter === 'NEW_STUDY_PROGRAMMES' && !isNewProgramme(programme)) continue

    const graduationYear = defineYear(enddate, isAcademicYear)
    let actualStartdate = startdate
    let level = null

    if (extentcode == 1) {
      level = 'bachelor'
    } else if (extentcode === 2) {
      if (studyrightid.slice(-2) === '-2') {
        level = 'bcMsCombo'
        actualStartdate = await findBachelorStartdate(studyrightid.replace(/-2$/, '-1'))
      } else {
        level = 'master'
      }
    } else if (extentcode === 4) {
      level = 'doctor'
    } else if (extentcode === 3) {
      level = 'licentiate'
    } else {
      continue
    }

    const absoluteTimeToGraduation = moment(enddate).diff(moment(actualStartdate), 'months')
    const statutoryAbsences = await getStatutoryAbsences(studentnumber, actualStartdate, enddate)
    const timeToGraduation = absoluteTimeToGraduation - statutoryAbsences

    graduationAmounts[level][graduationYear] += 1
    graduationTimes[level][graduationYear] = [...graduationTimes[level][graduationYear], timeToGraduation]
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
