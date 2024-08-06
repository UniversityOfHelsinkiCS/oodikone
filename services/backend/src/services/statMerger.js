const populationCourseStatsMerger = multiyearstats => {
  const coursecodes = []
  const stats = {}
  stats.coursetypes = {}
  stats.disciplines = {}
  stats.coursestatistics = []
  stats.allStudents = 0

  multiyearstats.forEach(yearstats => {
    stats.coursetypes = { ...stats.coursetypes, ...yearstats.coursetypes }
    stats.disciplines = { ...stats.disciplines, ...yearstats.coursetypes }
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
      stats.coursestatistics[index].stats.failedMany += courseStats.stats.failedMany
      stats.coursestatistics[index].stats.improvedPassedGrade += courseStats.stats.improvedPassedGrade
      stats.coursestatistics[index].stats.passed += courseStats.stats.passed
      stats.coursestatistics[index].stats.students += courseStats.stats.students

      stats.coursestatistics[index].stats.retryPassed += courseStats.stats.retryPassed

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
  const samples = {}
  samples.students = []
  samples.extents = []
  samples.semesters = []
  samples.courses = []
  samples.elementdetails = {}
  samples.elementdetails.data = {}
  samples.elementdetails.programmes = []
  samples.transfers = {}
  samples.transfers.targets = {}
  samples.transfers.sources = {}

  multiyearstudents.forEach(year => {
    samples.students = samples.students.concat(year.students)
    samples.extents = samples.extents.concat(year.extents)
    samples.semesters = samples.semesters.concat(year.semesters)
    samples.courses = samples.courses.concat(year.courses)
    samples.elementdetails.data = Object.assign(samples.elementdetails.data, year.elementdetails.data)
    samples.elementdetails.programmes = samples.elementdetails.programmes.concat(year.elementdetails.programmes)
    samples.transfers.targets = { ...samples.transfers.targets, ...year.transfers.targets }
    samples.transfers.sources = { ...samples.transfers.sources, ...year.transfers.sources }
  })
  return samples
}

module.exports = {
  populationCourseStatsMerger,
  populationStudentsMerger,
}
