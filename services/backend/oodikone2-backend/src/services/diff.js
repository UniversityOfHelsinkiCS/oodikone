// Returns an array containing all values that are in a but not in b taking account duplicates
const difference = (a, b) => {
  return a.filter(function(v) {
    return !this.get(v) || !this.set(v, this.get(v) - 1)
  }, b.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map()))
}

const mapStudentNumbers = (studentnumbers, yearcode, name) =>
  studentnumbers.map(studentnumber => ({
    studentnumber,
    yearcode,
    year: name
  }))

const getDiffForCourse = (oodiCourseStats, sisCourseStats) => {
  return oodiCourseStats.statistics.reduce(
    (courseDiff, oodiYearlyStats) => {
      const sisYearlyStats =
        sisCourseStats && sisCourseStats.statistics.find(s => s.yearcode === oodiYearlyStats.yearcode)

      if (!sisYearlyStats) {
        return {
          missingStudents: mapStudentNumbers(oodiYearlyStats.students.studentnumbers),
          extraStudents: []
        }
      }

      const missingStudentNumbers = difference(
        oodiYearlyStats.students.studentnumbers,
        sisYearlyStats.students.studentnumbers
      )
      const extraStudentNumbers = difference(
        sisYearlyStats.students.studentnumbers,
        oodiYearlyStats.students.studentnumbers
      )

      const missingStudents = mapStudentNumbers(missingStudentNumbers, oodiYearlyStats.yearcode, oodiYearlyStats.name)
      const extraStudents = mapStudentNumbers(extraStudentNumbers, oodiYearlyStats.yearcode, oodiYearlyStats.name)

      const noDifferenceInCourseStats = missingStudents.length === 0 && extraStudents.length === 0
      if (noDifferenceInCourseStats) {
        return courseDiff
      }

      return {
        missingStudents: courseDiff.missingStudents.concat(missingStudents),
        extraStudents: courseDiff.extraStudents.concat(extraStudents)
      }
    },
    { missingStudents: [], extraStudents: [] }
  )
}

const getCourseYearlyStatsDiff = (sisData, oodiData) => {
  return oodiData.map(oodiCourseStats => {
    const sisCourseStats = sisData.find(cs => cs.coursecode === oodiCourseStats.coursecode)
    return { coursecode: oodiCourseStats.coursecode, ...getDiffForCourse(oodiCourseStats, sisCourseStats) }
  })
}

module.exports = { getCourseYearlyStatsDiff }
