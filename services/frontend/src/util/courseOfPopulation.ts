const percentageOf = (num: number, denom: number) => {
  if (denom === 0) {
    return 0
  }
  return Math.round(((100 * num) / denom) * 100) / 100
}

const getFinalStats = (course, populationCount) => {
  const stats = { ...course.stats }
  const { students } = course

  stats.students = students.all.length
  stats.passed = students.passed.length
  stats.failed = students.failed.length
  stats.improvedPassedGrade = students.improvedPassedGrade.length
  stats.percentage = percentageOf(stats.passed, stats.students)
  stats.passedOfPopulation = percentageOf(stats.passed, populationCount)
  stats.triedOfPopulation = percentageOf(stats.students, populationCount)
  stats.perStudent = percentageOf(course.attempts, stats.passed + stats.failed) / 100
  stats.passingSemestersCumulative = {}
  stats.totalStudents = stats.students
  stats.totalEnrolledNoGrade = [].length
  stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents)

  return stats
}

export const filterCourses = (courseStatistics = [], filteredStudents = []) => {
  const courses = courseStatistics.map((course: object) => {
    return { ...course, stats: getFinalStats(course, filteredStudents.length) }
  })

  return { coursestatistics: courses }
}
