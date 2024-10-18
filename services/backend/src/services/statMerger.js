const populationCourseStatsMerger = multiyearstats => {
  const coursecodes = []
  const stats = {}
  stats.coursestatistics = []
  stats.allStudents = 0

  multiyearstats.forEach(yearstats => {
    stats.allStudents += yearstats.allStudents
    yearstats.coursestatistics.forEach(courseStats => {
      if (!coursecodes.includes(courseStats.course.code)) {
        coursecodes.push(courseStats.course.code)
        stats.coursestatistics.push(courseStats)
        return
      }

      const index = stats.coursestatistics.findIndex(s => s.course.code === courseStats.course.code)
      stats.coursestatistics[index].stats.attempts += courseStats.stats.attempts
      stats.coursestatistics[index].stats.failed += courseStats.stats.failed
      stats.coursestatistics[index].stats.improvedPassedGrade += courseStats.stats.improvedPassedGrade
      stats.coursestatistics[index].stats.passed += courseStats.stats.passed
      stats.coursestatistics[index].stats.students += courseStats.stats.students

      stats.coursestatistics[index].stats.perStudent =
        stats.coursestatistics[index].stats.attempts / stats.coursestatistics[index].stats.students

      stats.coursestatistics[index].stats.percentage =
        (stats.coursestatistics[index].stats.passed / stats.coursestatistics[index].stats.students) * 100

      stats.coursestatistics[index].stats.passedOfPopulation =
        (stats.coursestatistics[index].stats.passed / stats.allStudents) * 100

      stats.coursestatistics[index].stats.triedOfPopulation =
        (stats.coursestatistics[index].stats.students / stats.allStudents) * 100

      Object.keys(courseStats.stats.passingSemesters).forEach(key => {
        if (!stats.coursestatistics[index].stats.passingSemesters[key]) {
          stats.coursestatistics[index].stats.passingSemesters[key] = 0
        }
        stats.coursestatistics[index].stats.passingSemesters[key] += courseStats.stats.passingSemesters[key]
      })

      Object.keys(courseStats.stats.passingSemestersCumulative).forEach(key => {
        if (!stats.coursestatistics[index].stats.passingSemestersCumulative[key]) {
          stats.coursestatistics[index].stats.passingSemestersCumulative[key] = 0
        }
        stats.coursestatistics[index].stats.passingSemestersCumulative[key] +=
          courseStats.stats.passingSemestersCumulative[key]
      })

      Object.keys(courseStats.grades).forEach(grade => {
        if (!stats.coursestatistics[index].grades[grade]) {
          stats.coursestatistics[index].grades[grade] = courseStats.grades[grade]
        } else {
          stats.coursestatistics[index].grades[grade].count += courseStats.grades[grade].count
        }
      })

      Object.keys(courseStats.students).forEach(key2 => {
        if (!stats.coursestatistics[index].students[key2]) {
          stats.coursestatistics[index].students[key2] = courseStats.students[key2]
        } else {
          stats.coursestatistics[index].students[key2] = {
            ...stats.coursestatistics[index].students[key2],
            ...courseStats.students[key2],
          }
        }
      })
    })
  })
  return stats
}

const populationStudentsMerger = multiyearstudents => {
  const samples = { students: [], courses: [] }
  const uniqueCourseCodes = new Set()

  for (const year of multiyearstudents) {
    samples.students = samples.students.concat(year.students)
    for (const course of year.courses) {
      if (!uniqueCourseCodes.has(course.code)) {
        uniqueCourseCodes.add(course.code)
        samples.courses.push(course)
      }
    }
  }

  return samples
}

module.exports = {
  populationCourseStatsMerger,
  populationStudentsMerger,
}
