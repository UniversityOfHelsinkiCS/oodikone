import { createSelector } from 'reselect'
import { sortBy, flatten } from 'lodash'

const courseStatsSelector = state => state.courseStats.data

const getCourseStats = createSelector(
  [courseStatsSelector],
  courseStats => {
    const stats = {}
    Object.entries(courseStats).forEach(entry => {
      const [coursecode, data] = entry
      const { statistics } = data
      stats[coursecode] = {
        ...data,
        statistics
      }
    })
    return stats
  }
)

const selectedCourseSelector = state => state.singleCourseStats.selectedCourse

const getQueryInfo = createSelector(
  [getCourseStats],
  stats => {
    const courseStats = Object.values(stats)
    const semesters = {}
    const courses = []
    courseStats.forEach(c => {
      courses.push({
        code: c.coursecode,
        name: c.name,
        alternatives: c.alternatives
      })
      c.statistics.forEach(({ name, code }) => {
        semesters[code] = { name, code }
      })
    })
    const timeframe = sortBy(Object.values(semesters), 'code')
    return { courses, timeframe }
  }
)

// export const newLocal = <Popup content="Students from all programmes" trigger="All" />
export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: 'All',
  description: 'All students combined'
}

const mergeStudents = (students1, students2) => {
  Object.keys(students2).forEach(k => {
    if (students1[k]) {
      students1[k] = [...students1[k], ...students2[k]]
    } else {
      students1[k] = students2[k]
    }
  })
  return students1
}

const getAllStudyProgrammes = createSelector(
  [getCourseStats, selectedCourseSelector],
  (courseStats, selectedCourseCode) => {
    const studentsIncluded = new Set(
      selectedCourseCode
        ? courseStats[selectedCourseCode].statistics.reduce(
            (res, curr) => [...res, ...curr.students.studentnumbers],
            []
          )
        : Object.values(courseStats).reduce((totalStudents, programme) => {
            const programmeStudents = programme.statistics.reduce(
              (res, curr) => [...res, ...curr.students.studentnumbers],
              []
            )
            return [...totalStudents, ...programmeStudents]
          }, [])
    )

    const all = {}
    Object.values(courseStats).forEach(stat => {
      const { programmes } = stat
      Object.entries(programmes).forEach(entry => {
        const [code, info] = entry
        const { name, students } = info
        const filteredStudents = Object.keys(students).reduce(
          (acc, k) => ({ ...acc, [k]: students[k].filter(s => studentsIncluded.has(s)) }),
          {}
        )
        if (!all[code]) {
          all[code] = {
            key: code,
            value: code,
            description: code === 'OTHER' ? 'Students with no associated programme' : '',
            text: name,
            students: filteredStudents
          }
        } else {
          all[code].students = mergeStudents(all[code].students, filteredStudents)
        }
      })
    })

    let allStudents = {}
    Object.values(all).forEach(curr => {
      allStudents = mergeStudents(allStudents, curr.students)
    })
    const programmes = Object.values(all).map(p => ({ ...p, size: p.students.length }))
    return [{ ...ALL, students: allStudents }, ...programmes]
  }
)

const getProgrammesFromProps = (state, { programmeCodes, programmes }) => ({ programmeCodes, programmes })

const calculatePassRate = (passed, failed) => {
  const passRate = (100 * passed) / (passed + failed)
  return passRate ? passRate.toFixed(2) : null
}

const getRealisationStats = (realisation, filterStudentFn, userHasAccessToAllStats) => {
  const { name, attempts, obfuscated } = realisation
  const { passed, failed } = attempts.classes
  const passedAmount = userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
  const failedAmount = userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length

  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passrate: calculatePassRate(passedAmount, failedAmount),
    obfuscated
  }
}

const getSummaryStats = (statistics, filterStudentFn, userHasAccessToAllStats) => {
  const summaryAcc = {
    passed: 0,
    failed: 0
  }

  const summary = statistics.reduce((acc, cur) => {
    const { passed, failed } = cur.attempts.classes
    acc.passed += userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
    acc.failed += userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
    return acc
  }, summaryAcc)

  summary.passrate = calculatePassRate(summary.passed, summary.failed)

  return summary
}

const summaryStatistics = createSelector(
  getCourseStats,
  getProgrammesFromProps,
  (courseStats, { programmeCodes, programmes }, userHasAccessToAllStats) => {
    const filteredProgrammes = programmes.filter(p => programmeCodes.includes(p.key))
    const students = new Set(filteredProgrammes.reduce((acc, p) => [...acc, ...flatten(Object.values(p.students))], []))

    const filterStudentFn = studentNumber => students.has(studentNumber)
    return Object.entries(courseStats).map(entry => {
      const [coursecode, data] = entry
      const { statistics, name } = data

      // No filters based on programmes can be applied, if the programme and student number-data
      // has been obfuscated
      const realisations = statistics.map(realisation =>
        getRealisationStats(realisation, filterStudentFn, userHasAccessToAllStats)
      )
      const summary = getSummaryStats(statistics, filterStudentFn, userHasAccessToAllStats)

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
  stats =>
    Object.values(stats).map(({ name, coursecode: code }) => ({
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
