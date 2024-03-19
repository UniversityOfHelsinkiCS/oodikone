import { createSelector } from '@reduxjs/toolkit'
import { sortBy, flatten } from 'lodash'

const courseStatsSelector = state => state.courseStats.data
const openOrRegularSelector = state => state.courseSearch.openOrRegular
const singleCourseStatsSelector = state => state.singleCourseStats

export const getCourseStats = createSelector(
  [courseStatsSelector, openOrRegularSelector],
  (courseStats, openOrRegular) => {
    const stats = {}

    Object.entries(courseStats).forEach(entry => {
      const [coursecode] = entry
      const data = entry[1][openOrRegular]
      const { statistics } = data
      stats[coursecode] = {
        ...data,
        statistics,
      }
    })
    return stats
  }
)

export const getCourseAlternatives = createSelector(
  [courseStatsSelector, openOrRegularSelector, singleCourseStatsSelector],
  (courseStats, openOrRegular, singleCourseStats) => {
    return courseStats[singleCourseStats.selectedCourse][openOrRegular].alternatives
  }
)
export const getAvailableStats = createSelector([courseStatsSelector], courseStats => {
  const availableStats = {}

  Object.entries(courseStats).forEach(entry => {
    const [coursecode] = entry

    availableStats[coursecode] = {
      unify: entry[1].unifyStats.statistics.length > 0,
      open: entry[1].openStats.statistics.length > 0,
      university: entry[1].regularStats.statistics.length > 0,
    }
  })
  return availableStats
})

const selectedCourseSelector = state => state.singleCourseStats.selectedCourse

export const getQueryInfo = createSelector([getCourseStats], stats => {
  const courseStats = Object.values(stats)
  const semesters = {}
  const courses = []
  courseStats.forEach(course => {
    courses.push({
      code: course.coursecode,
      name: course.name,
      alternatives: course.alternatives,
    })
    course.statistics.forEach(({ name, code }) => {
      semesters[code] = { name, code }
    })
  })
  const timeframe = sortBy(Object.values(semesters), 'code')
  return { courses, timeframe }
})

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: 'All',
  description: 'All students combined',
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

export const getAllStudyProgrammes = createSelector(
  [getCourseStats, selectedCourseSelector],
  (courseStats, selectedCourseCode) => {
    const studentsIncluded = new Set(
      selectedCourseCode
        ? courseStats[selectedCourseCode]?.statistics?.reduce(
            (res, curr) => [...res, ...curr.students.studentnumbers],
            []
          )
        : Object.values(courseStats).reduce((totalStudents, programme) => {
            const programmeStudents = programme?.statistics?.reduce(
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
          (acc, k) => ({ ...acc, [k]: students[k].filter(student => studentsIncluded.has(student)) }),
          {}
        )
        if (!all[code]) {
          all[code] = {
            key: code,
            value: code,
            description: code === 'OTHER' ? 'Students with no associated programme' : '',
            text: name,
            students: filteredStudents,
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
  const { passed, failed } = attempts.categories
  const passedAmount = userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
  const failedAmount = userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length

  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passrate: calculatePassRate(passedAmount, failedAmount),
    obfuscated,
  }
}

const getSummaryStats = (statistics, filterStudentFn, userHasAccessToAllStats) => {
  const summaryAcc = {
    passed: 0,
    failed: 0,
  }

  const summary = statistics.reduce((acc, cur) => {
    const { passed, failed } = cur.attempts.categories
    acc.passed += userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
    acc.failed += userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
    return acc
  }, summaryAcc)

  summary.passrate = calculatePassRate(summary.passed, summary.failed)

  return summary
}

export const summaryStatistics = createSelector(
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
        realisations,
      }
    })
  }
)

export const getCourses = createSelector(getCourseStats, stats =>
  Object.values(stats).map(({ name, coursecode: code }) => ({
    code,
    name,
  }))
)
