export const calculateStatsForProgramme = (stats, fromYear, toYear) => {
  const res = {
    totalStudentCredits: 0,
    totalCoursesPassed: 0,
    totalCoursesFailed: 0,
    totalStudents: []
  }

  Object.entries(stats)
    .filter(([year]) => year >= fromYear && year <= toYear)
    .forEach(([, stat]) => {
      const { studentCredits, coursesPassed, coursesFailed, studentArray } = stat
      res.totalStudentCredits += studentCredits
      res.totalCoursesPassed += coursesPassed
      res.totalCoursesFailed += coursesFailed
      res.totalStudents = [...new Set(res.totalStudents.concat(studentArray))]
    })
  return res
}

export const calculateTotalPassedCourses = ({ totalCoursesPassed, totalCoursesFailed }) => {
  const ratio = (totalCoursesPassed / (totalCoursesPassed + totalCoursesFailed)) * 100
  return Number.isNaN(ratio) ? 0 : ratio
}

export const calculateTotalFailedCourses = ({ totalCoursesPassed, totalCoursesFailed }) => {
  const totalPassedRatio = calculateTotalPassedCourses({ totalCoursesPassed, totalCoursesFailed })
  if (totalPassedRatio === 0) return 0
  return 100 - totalPassedRatio
}
