import { createSelector } from '@reduxjs/toolkit'
import { flatten } from 'lodash'

import { RootState } from '@/redux'
import { CourseStat, Realisation } from '@/types/courseStat'
import { Name } from '@oodikone/shared/types'

const courseStatsSelector = (state: RootState) => state.courseStats.data // TODO: Type at source
const openOrRegularSelector = (state: RootState) => state.courseSearch.openOrRegular
const courseSummaryFormProgrammesSelector = (state: RootState) => state.courseSummaryForm.programmes
const selectedCourseSelector = (state: RootState) => state.selectedCourse.selectedCourse

type CourseStats = Record<string, { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }>

export const getCourseStats = createSelector(
  [courseStatsSelector, openOrRegularSelector],
  (courseStats: CourseStats, openOrRegular) => {
    const stats: Record<string, CourseStat> = {}
    Object.entries(courseStats).forEach(entry => {
      const [courseCode] = entry
      const data = entry[1][openOrRegular]
      const { statistics } = data
      stats[courseCode] = {
        ...data,
        statistics,
      }
    })
    return stats
  }
)

export const getCourseAlternatives = createSelector(
  [courseStatsSelector, openOrRegularSelector, selectedCourseSelector],
  (courseStats: CourseStats, openOrRegular, selectedCourse) => {
    if (!selectedCourse) {
      return []
    }
    return courseStats[selectedCourse][openOrRegular].alternatives
  }
)

export const getAvailableStats = createSelector([courseStatsSelector], (courseStats: CourseStats) => {
  const availableStats = { unify: false, open: false, university: false }
  Object.entries(courseStats).forEach(entry => {
    const [courseCode] = entry
    availableStats[courseCode] = {
      unify: entry[1].unifyStats.statistics.length > 0,
      open: entry[1].openStats.statistics.length > 0,
      university: entry[1].regularStats.statistics.length > 0,
    }
  })
  return availableStats
})

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: {
    fi: 'All',
    en: 'All',
    sv: 'All',
  } as Name,
  description: 'All students combined',
} as const

const mergeStudents = (students1: Record<string, string[]>, students2: Record<string, string[]>) => {
  Object.keys(students2).forEach(yearCode => {
    if (students1[yearCode]) {
      students1[yearCode] = [...students1[yearCode], ...students2[yearCode]]
    } else {
      students1[yearCode] = students2[yearCode]
    }
  })
  return students1
}

export const getAllStudyProgrammes = createSelector(
  [getCourseStats, selectedCourseSelector],
  (courseStats: Record<string, CourseStat>, selectedCourseCode) => {
    const selectedStudentNumbers = courseStats[selectedCourseCode!]?.statistics?.reduce(
      (res, curr) => [...res, ...curr.students.studentNumbers],
      [] as string[]
    )
    const allStudentNumbers = Object.values(courseStats).reduce((totalStudents, programme) => {
      const programmeStudents = programme?.statistics?.reduce(
        (res, curr) => [...res, ...curr.students.studentNumbers],
        [] as string[]
      )
      return [...totalStudents, ...programmeStudents]
    }, [] as string[])
    const studentsIncluded = new Set<string>(selectedCourseCode ? selectedStudentNumbers : allStudentNumbers)

    const all: Record<
      string,
      { key: string; value: string; description: string; text: Name; students: Record<string, string[]> }
    > = {}
    Object.values(courseStats).forEach(stat => {
      const { programmes } = stat
      Object.entries(programmes).forEach(entry => {
        const [code, info] = entry
        const { name, students } = info
        const filteredStudents = Object.keys(students).reduce(
          (acc, k) => ({ ...acc, [k]: students[k].filter(student => studentsIncluded.has(student)) }),
          {} as Record<string, string[]>
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

    let allStudents: Record<string, string[]> = {}
    Object.values(all).forEach(curr => {
      allStudents = mergeStudents(allStudents, curr.students)
    })
    const programmes = Object.values(all).map(programme => ({ ...programme, size: programme.students.length }))
    return [{ ...ALL, students: allStudents }, ...programmes]
  }
)

const calculatePassRate = (passed: number, failed: number) => {
  if (passed === 0 && failed > 0) {
    return '0.00'
  }
  const passRate = (100 * passed) / (passed + failed)
  return passRate ? passRate.toFixed(2) : null
}

const getRealisationStats = (
  realisation: Realisation,
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const { name, attempts, obfuscated } = realisation
  const { passed, failed } = attempts.categories
  const passedAmount = userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
  const failedAmount = userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passRate: calculatePassRate(passedAmount, failedAmount),
    obfuscated,
  }
}

const getSummaryStats = (
  statistics: Realisation[],
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const summary = statistics.reduce(
    (acc, cur) => {
      const { passed, failed } = cur.attempts.categories
      acc.passed += userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
      acc.failed += userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
      return acc
    },
    {
      passed: 0,
      failed: 0,
    } as { passed: number; failed: number; passRate: string | null }
  )

  summary.passRate = calculatePassRate(summary.passed, summary.failed)

  return summary
}

const summaryStatistics = createSelector(
  [
    getCourseStats,
    getAllStudyProgrammes,
    courseSummaryFormProgrammesSelector,
    (_, userHasAccessToAllStats) => userHasAccessToAllStats,
  ],
  (courseStats, programmes, programmeCodes, userHasAccessToAllStats: boolean) => {
    const filteredProgrammes = programmes.filter(programme => programmeCodes.includes(programme.key))
    const students = new Set(
      filteredProgrammes.reduce(
        (acc, programme) => [...acc, ...flatten(Object.values(programme.students))],
        [] as string[]
      )
    )

    const filterStudentFn = (studentNumber: string) => students.has(studentNumber)

    return Object.entries(courseStats).map(entry => {
      const [coursecode, data] = entry
      const { statistics, name } = data

      // No filters based on programmes can be applied, if the
      // programme and student number data has been obfuscated
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

export const getSummaryStatistics = (state: RootState, userHasAccessToAllStats: boolean) => {
  // * Awful hack for satisfying TypeScript
  // ? Can userHasAccessToAllStats be passed directly to summaryStatistics?
  return summaryStatistics.resultFunc(
    getCourseStats(state),
    getAllStudyProgrammes(state),
    courseSummaryFormProgrammesSelector(state),
    userHasAccessToAllStats
  )
}

export const getCourses = createSelector(getCourseStats, courseStats => {
  return Object.values(courseStats).map(({ name, coursecode: code }) => ({
    code,
    name,
  }))
})
