export const calculateStatsForProgramme = (stats, fromYear, toYear) => {
  const res = {
    totalStudentCredits: 0,
    totalCoursesPassed: 0,
    totalCoursesFailed: 0
  }

  Object.entries(stats)
    .filter(([year]) => year >= fromYear && year <= toYear)
    .forEach(([, stat]) => {
      const { studentCredits, coursesPassed, coursesFailed } = stat
      res.totalStudentCredits += studentCredits
      res.totalCoursesPassed += coursesPassed
      res.totalCoursesFailed += coursesFailed
    })

  return res
}

export const calculateTotalPassedCourses = ({ totalCoursesPassed, totalCoursesFailed }) => {
  const ratio = ((totalCoursesPassed / (totalCoursesPassed + totalCoursesFailed)) * 100)
  return Number.isNaN(ratio) ? 0 : ratio
}

export const calculateTotalFailedCourses = ({ totalCoursesPassed, totalCoursesFailed }) => {
  const totalPassedRatio = calculateTotalPassedCourses({ totalCoursesPassed, totalCoursesFailed })
  if (totalPassedRatio === 0) return 0
  return 100 - totalPassedRatio
}
