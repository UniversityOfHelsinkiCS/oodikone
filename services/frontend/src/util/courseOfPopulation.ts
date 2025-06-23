import { CourseStats } from '@oodikone/shared/routes/populations'

const percentageOf = (num: number, denom: number) => {
  if (denom === 0) {
    return 0
  }
  return Math.round(((100 * num) / denom) * 100) / 100
}

// courseStatsCounter legacy solution
const getCumulativePassingSemesters = semesters => {
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

const getEnrolledNoGrade = course => {
  const enrollments = new Set(course.enrollments.ENROLLED)
  for (const student of course.students.all) {
    enrollments.delete(student)
  }

  return Array.from(enrollments)
}

// courseStatsCounter legacy solution
const getFinalStats = (course, populationCount) => {
  const stats = { ...course.stats }
  const { students } = course

  stats.students = Array.from(new Set([...course.students.all, ...course.enrollments.ENROLLED])).length
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
  stats.totalEnrolledNoGrade = getEnrolledNoGrade(course).length
  stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents)

  return stats
}

const reconstructCourse = (course: CourseStats, populationCount: number) => ({
  ...course,
  // courseStatsCounter legacy solution
  students: Object.fromEntries(
    Object.entries({
      ...course.students,
      all: Array.from(new Set([...course.students.all, ...course.enrollments.ENROLLED])),
    }).map(([key, val]) => [key, Object.fromEntries(val.map(n => [n, true]))])
  ),
  stats: getFinalStats(course, populationCount),
})

export const filterCourses = (courseStatistics: any[], filteredStudents: any[]) => {
  const courses = courseStatistics.map(course => reconstructCourse(course, filteredStudents.length))

  return courses
}
