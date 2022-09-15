const moment = require('moment')
const {
  graduatedStudyrights,
  graduatedStudyrightsByStartYear,
  bachelorStudyright,
  statutoryAbsences,
} = require('./faculty')
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

const addGraduation = async (
  extentcode,
  startdate,
  studyrightid,
  enddate,
  studentnumber,
  graduationAmounts,
  graduationTimes,
  year
) => {
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
    return
  }

  const absoluteTimeToGraduation = moment(enddate).diff(moment(actualStartdate), 'months')
  const statutoryAbsences = await getStatutoryAbsences(studentnumber, actualStartdate, enddate)
  const timeToGraduation = absoluteTimeToGraduation - statutoryAbsences

  graduationAmounts[level][year] += 1
  graduationTimes[level][year] = [...graduationTimes[level][year], timeToGraduation]
}

const countByStartYear = async (faculty, since, years, yearsList, levels, programmeFilter) => {
  let graduationAmounts = {}
  let graduationTimes = {}
  let byStartYear = {
    means: {},
    medians: {},
  }

  levels.forEach(level => {
    graduationAmounts[level] = getYearsObject({ years: yearsList })
    graduationTimes[level] = getYearsObject({ years: yearsList, emptyArrays: true })
    byStartYear.medians[level] = []
    byStartYear.means[level] = []
  })

  const graduatedRights = await graduatedStudyrightsByStartYear(faculty, since)
  for (const right of graduatedRights) {
    const { enddate, startdate, studyrightid, extentcode, studyrightElements, studentnumber } = right
    const { programme } = findRightProgramme(studyrightElements, 'graduated')
    if (programmeFilter === 'NEW_STUDY_PROGRAMMES' && !isNewProgramme(programme)) continue

    const startYear = defineYear(startdate, false)
    await addGraduation(
      extentcode,
      startdate,
      studyrightid,
      enddate,
      studentnumber,
      graduationAmounts,
      graduationTimes,
      startYear
    )
  }
  years.forEach(year => {
    levels.forEach(level => {
      const median = getMedian(graduationTimes[level][year])
      const mean = getMean(graduationTimes[level][year])
      byStartYear.medians[level] = [
        ...byStartYear.medians[level],
        { y: median, amount: graduationAmounts[level][year] },
      ]
      byStartYear.means[level] = [...byStartYear.means[level], { y: mean, amount: graduationAmounts[level][year] }]
    })
  })

  return byStartYear
}

const countByGraduationYear = async (faculty, since, years, yearsList, levels, programmeFilter) => {
  let graduationAmounts = {}
  let graduationTimes = {}
  let byGradYear = {
    means: {},
    medians: {},
  }

  levels.forEach(level => {
    graduationAmounts[level] = getYearsObject({ years: yearsList })
    graduationTimes[level] = getYearsObject({ years: yearsList, emptyArrays: true })
    byGradYear.medians[level] = []
    byGradYear.means[level] = []
  })

  const graduatedRights = await graduatedStudyrights(faculty, since)

  for (const right of graduatedRights) {
    const { enddate, startdate, studyrightid, extentcode, studyrightElements, studentnumber } = right
    const { programme } = findRightProgramme(studyrightElements, 'graduated')
    if (programmeFilter === 'NEW_STUDY_PROGRAMMES' && !isNewProgramme(programme)) continue

    const graduationYear = defineYear(enddate, false)
    await addGraduation(
      extentcode,
      startdate,
      studyrightid,
      enddate,
      studentnumber,
      graduationAmounts,
      graduationTimes,
      graduationYear
    )
  }

  years.forEach(year => {
    levels.forEach(level => {
      const median = getMedian(graduationTimes[level][year])
      const mean = getMean(graduationTimes[level][year])
      byGradYear.medians[level] = [...byGradYear.medians[level], { y: median, amount: graduationAmounts[level][year] }]
      byGradYear.means[level] = [...byGradYear.means[level], { y: mean, amount: graduationAmounts[level][year] }]
    })
  })

  return byGradYear
}

const countGraduationTimes = async (faculty, programmeFilter) => {
  const isAcademicYear = false // = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsList = getYearsArray(since.getFullYear(), isAcademicYear)
  const levels = ['bachelor', 'bcMsCombo', 'master', 'doctor', 'licentiate']

  const years = [...yearsList].reverse()
  const goals = {
    bachelor: 36,
    bcMsCombo: 60,
    master: 24,
    doctor: 48,
    // Fix differrent cases?
    licentiate: 78,
  }

  // We count studyrights (vs. studyright_elements)
  // This way we get the whole time for a degree, even if the student was transferred to a new programme
  // E.g. started 8/2016 in old Bc, transferred to new 10/2020, graduated from new 1/2021 --> total 53 months (not 3)
  const byGradYear = await countByGraduationYear(faculty, since, years, yearsList, levels, programmeFilter)
  const byStartYear = await countByStartYear(faculty, since, years, yearsList, levels, programmeFilter)

  return { years, goals, byGradYear, byStartYear }
}

module.exports = { countGraduationTimes }
