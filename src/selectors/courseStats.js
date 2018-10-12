import { createSelector } from 'reselect'

const nameAsString = (data, language) => {
  if (typeof data === 'string') {
    return data
  }
  return data[language] || Object.values(data)[0]
}

const getCourseStats = (state) => {
  const { language } = state.settings
  const stats = {}
  Object.entries(state.courseStats.data).forEach((entry) => {
    const [coursecode, data] = entry
    const { statistics } = data
    stats[coursecode] = {
      ...data,
      statistics: statistics.map(stat => ({
        ...stat,
        name: nameAsString(stat.name, language)
      }))
    }
  })
  return stats
}


const getQueryInfo = (state) => {
  const courseStats = Object.values(getCourseStats(state))
  const timeframe = []
  const courses = []
  courseStats.forEach((c) => {
    courses.push({
      code: c.coursecode,
      name: c.name,
      alternatives: c.alternatives
    })
  })
  const { statistics } = courseStats[0]
  statistics.forEach((stat) => {
    timeframe.push({
      name: stat.name,
      code: stat.code
    })
  })
  const from = timeframe[0]
  const frames = timeframe.length
  const to = frames === 1 ? undefined : timeframe[frames - 1]
  return { courses, timeframe, from, to }
}

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: 'All'
}

const mergeUnique = (arr1, arr2) => [...new Set([...arr1, ...arr2])]

const getAllStudyProgrammes = createSelector([getCourseStats], (courseStats) => {
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
          text: name.fi || name.en || name.sv,
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

const getProgrammesFromProps = (state, { programme, programmes }) => ({ programme, programmes })

const summaryStatistics = createSelector(
  getCourseStats,
  getProgrammesFromProps,
  (s, { programme: code, programmes }) => {
    const prog = programmes.find(p => p.key === code)
    const filterStudent = studentnumber => new Set(prog.students).has(studentnumber)
    return Object.entries(s).map((entry) => {
      const [coursecode, data] = entry
      const { statistics, name } = data
      const summary = {
        passed: 0,
        failed: 0
      }
      statistics.forEach((groupstat) => {
        const { passed, failed } = groupstat.attempts.classes
        summary.passed += passed.filter(filterStudent).length
        summary.failed += failed.filter(filterStudent).length
      })
      const passrate = (100 * summary.passed) / (summary.passed + summary.failed)
      summary.passrate = !passrate ? null : passrate.toFixed(2)
      return {
        coursecode,
        name,
        summary
      }
    })
  }
)

const getCourses = createSelector(
  getCourseStats,
  (stats) => {
    const courses = Object.values(stats).map(({ name, coursecode: code }) => ({
      code,
      name
    }))
    return courses
  }
)

export default {
  getCourseStats,
  getCourses,
  getAllStudyProgrammes,
  summaryStatistics,
  ALL,
  getQueryInfo
}
