import { CourseStats } from '@oodikone/shared/routes/populations'
import { FormattedCourse } from '@oodikone/shared/types/courseData'

const percentageOf = (num: number, denom: number) => {
  if (denom === 0) {
    return 0
  }
  return Math.round(((100 * num) / denom) * 100) / 100
}

// courseStatsCounter legacy solution
const getCumulativePassingSemesters = (semesters: CourseStats['stats']['passingSemesters']) => {
  const attemptStats: Record<string, number> = {}

  attemptStats.BEFORE = semesters.BEFORE
  attemptStats['0-FALL'] = semesters.BEFORE + semesters['0-FALL']
  attemptStats['0-SPRING'] = attemptStats['0-FALL'] + semesters['0-SPRING']

  for (let i = 1; i < 7; i++) {
    attemptStats[`${i}-FALL`] = attemptStats[`${i - 1}-SPRING`] + semesters[`${i}-FALL`]
    attemptStats[`${i}-SPRING`] = attemptStats[`${i}-FALL`] + semesters[`${i}-SPRING`]
  }

  attemptStats.LATER = attemptStats['6-SPRING'] + semesters.LATER

  return attemptStats
}

// courseStatsCounter legacy solution
const getFinalStats = (course: CourseStats, populationCount: number): FormattedCourse['stats'] => {
  const stats = { ...course.stats } as FormattedCourse['stats']
  const { students } = course

  stats.students = course.students.all.length
  stats.passed = students.passed.length
  stats.failed = students.failed.length
  stats.attempts = course.attempts
  stats.improvedPassedGrade = students.improvedPassedGrade.length
  stats.percentage = percentageOf(stats.passed, stats.students)
  stats.passedOfPopulation = percentageOf(stats.passed, populationCount)
  stats.triedOfPopulation = percentageOf(stats.students, populationCount)
  stats.perStudent = percentageOf(course.attempts, stats.passed + stats.failed) / 100
  stats.passingSemestersCumulative = getCumulativePassingSemesters(stats.passingSemesters)
  stats.totalStudents = stats.students
  stats.totalEnrolledNoGrade = students.enrolledNoGrade.length
  stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents)

  return stats
}

const reconstructCourse = (course: CourseStats, populationCount: number): FormattedCourse => ({
  ...course,
  // courseStatsCounter legacy solution
  students: Object.fromEntries(
    Object.entries(course.students).map(([key, val]) => [key, Object.fromEntries(val.map(n => [n, true]))])
  ) as FormattedCourse['students'],
  stats: getFinalStats(course, populationCount),
})

export const filterCourses = (courseStatistics: CourseStats[], populationCount: number) => {
  const courses = courseStatistics.map(course => reconstructCourse(course, populationCount))

  return courses
}
