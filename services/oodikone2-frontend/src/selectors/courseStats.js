import { createSelector } from 'reselect'
import { getActiveLanguage } from 'react-localize-redux'
import { getTextIn } from '../common'

const nameAsString = (data, language) => {
  if (typeof data === 'string') {
    return data
  }
  return getTextIn(data, language)
}

const getCourseStats = (state) => {
  const stats = {}
  Object.entries(state.courseStats.data).forEach((entry) => {
    const [coursecode, data] = entry
    const { statistics } = data
    stats[coursecode] = {
      ...data,
      statistics: statistics.map(stat => ({
        ...stat,
        name: nameAsString(stat.name, getActiveLanguage(state.localize).code)
      }))
    }
  })
  return stats
}

const languageSelector = state => getActiveLanguage(state.localize).code

const getQueryInfo = (state) => {
  const courseStats = Object.values(getCourseStats(state))
  const semesters = {}
  const courses = []
  courseStats.forEach((c) => {
    courses.push({
      code: c.coursecode,
      name: c.name,
      alternatives: c.alternatives
    })
    c.statistics.forEach(({ name, code }) => {
      semesters[code] = { name, code }
    })
  })
  const timeframe = Object.values(semesters).sort((t1, t2) => t1.code > t2.code)
  return { courses, timeframe }
}

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: 'All'
}

const mergeUnique = (arr1, arr2) => [...new Set([...arr1, ...arr2])]

const getAllStudyProgrammes = createSelector([getCourseStats, languageSelector], (courseStats, language) => {
  const all = {}
  let studentnumbers = []
  Object.values(courseStats).forEach((stat) => {
    const { programmes: p } = stat
    Object.entries(p).forEach((entry) => {
      const [code, info] = entry
      const { name, students } = info
      studentnumbers = mergeUnique(studentnumbers, students)
      if (!all[code]) {
        all[code] = {
          key: code,
          value: code,
          text: getTextIn(name, language),
          students
        }
      } else {
        const programme = all[code]
        programme.students = mergeUnique(students, programme.students)
      }
    })
  })
  const programmes = Object.values(all)
    .map(p => ({ ...p, size: p.students.length || 0 }))
    .sort((p1, p2) => p2.size - p1.size)
  return [
    { ...ALL, students: studentnumbers, size: studentnumbers.length },
    ...programmes
  ]
})

const getProgrammesFromProps = (state, { programmeCodes, programmes }) => ({ programmeCodes, programmes })

const calculatePassRate = (passed, failed) => {
  const passRate = (100 * passed) / (passed + failed)
  return passRate ? passRate.toFixed(2) : null
}

const getRealisationStats = (realisation, filterStudentFn) => {
  const { name, attempts } = realisation
  const { passed, failed } = attempts.classes
  const passedAmount = passed.filter(filterStudentFn).length
  const failedAmount = failed.filter(filterStudentFn).length
  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passrate: calculatePassRate(passedAmount, failedAmount)
  }
}

const getSummaryStats = (statistics, filterStudentFn) => {
  const summaryAcc = {
    passed: 0,
    failed: 0
  }

  const summary = statistics.reduce((acc, cur) => {
    const { passed, failed } = cur.attempts.classes
    acc.passed += passed.filter(filterStudentFn).length
    acc.failed += failed.filter(filterStudentFn).length
    return acc
  }, summaryAcc)

  summary.passrate = calculatePassRate(summary.passed, summary.failed)

  return summary
}

const summaryStatistics = createSelector(
  getCourseStats,
  getProgrammesFromProps,
  (courseStats, { programmeCodes, programmes }) => {
    const filteredProgrammes = programmes.filter(p => programmeCodes.includes(p.key))
    const students = new Set(filteredProgrammes.reduce((acc, p) => [...acc, ...p.students], []))

    const filterStudentFn = studentNumber => students && students.has(studentNumber)
    return Object.entries(courseStats).map((entry) => {
      const [coursecode, data] = entry
      const { statistics, name } = data

      const realisations =
        statistics.map(realisation => getRealisationStats(realisation, filterStudentFn))
      const summary = getSummaryStats(statistics, filterStudentFn)

      return {
        coursecode,
        name,
        summary,
        realisations
      }
    })
  }
)

const getCourses = createSelector(
  getCourseStats,
  stats => Object.values(stats).map(({ name, coursecode: code }) => ({
    code,
    name
  }))
)

export default {
  getCourseStats,
  getCourses,
  getAllStudyProgrammes,
  summaryStatistics,
  ALL,
  getQueryInfo
}
