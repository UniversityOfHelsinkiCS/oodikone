const lengthOf = obj => Object.keys(obj).length
const percentageOf = (num, denom) => Number((100 * num / denom).toFixed(2))

class CourseStatsCounter {

  constructor(code, name, allstudents) {
    this.studentsInTotal = Object.keys(allstudents).length
    this.course = {
      code,
      name,
      disciplines: {},
      coursetypes: {}
    }
    this.students = {
      all: {},
      passed: {},
      failed: {},
      retryPassed: {},
      failedMany: {},
      improvedPassedGrade: {},
      notParticipated: { ...allstudents },
      notParticipatedOrFailed: { ...allstudents }
    }
    this.stats = {
      students: 0,
      passed: 0,
      failed: 0,
      failedMany: 0,
      retryPassed: 0,
      attempts: 0,
      improvedPassedGrade: 0,
      percentage: undefined,
      passedOfPopulation: undefined,
      triedOfPopulation: undefined,
      passingSemesters: this.initializePassingSemesters()
    }
    this.grades = {}
  }

  initializePassingSemesters() {
    const passingSemesters = {
      BEFORE: 0,
      LATER: 0
    }

    for (let i = 0; i < 7; i++) {
      passingSemesters[`${i}-FALL`] = 0
      passingSemesters[`${i}-SPRING`] = 0
    }

    return passingSemesters
  }

  markAttempt() {
    this.stats.attempts = this.stats.attempts + 1
  }

  markParticipation(studentnumber) {
    delete this.students.notParticipated[studentnumber]
  }

  markToAll(studentnumber) {
    this.students.all[studentnumber] = true
  }

  markPassedSemester(semester) {
    this.stats.passingSemesters[semester]++
  }

  markCredit(studentnumber, grade, passed, failed, improved, semester) {
    // studentnumber = `${shajs('sha256').update(process.env.key + studentnumber).digest('hex')}`
    this.markAttempt()
    this.markParticipation(studentnumber)
    this.markGrade(grade, passed, failed, improved)
    this.markToAll(studentnumber)
    if (passed) {
      this.markPassingGrade(studentnumber)
      if (!improved) {
        this.markPassedSemester(semester)
      }
    } else if (improved) {
      this.markImprovedGrade(studentnumber)
    } else if (failed) {
      this.markFailedGrade(studentnumber)
    } 
  }

  failedBefore(studentnumber) {
    return (this.students.failed[studentnumber] !== undefined)
  }

  passedBefore(studentnumber) {
    return (this.students.passed[studentnumber] !== undefined)
  }

  removeFromFailed(studentnumber) {
    delete this.students.failed[studentnumber]
    delete this.students.failedMany[studentnumber]
  }

  markPassingGrade(studentnumber) {
    delete this.students.notParticipatedOrFailed[studentnumber]
    this.students.passed[studentnumber] = true
    if (this.failedBefore(studentnumber)) {
      this.students.retryPassed[studentnumber] = true
      this.removeFromFailed(studentnumber)
    }
  }

  markImprovedGrade(studentnumber) {
    this.removeFromFailed(studentnumber)
    this.students.improvedPassedGrade[studentnumber] = true
    this.students.passed[studentnumber] = true
  }

  markFailedGrade(studentnumber) {
    if (this.passedBefore(studentnumber)) {
      this.students.retryPassed[studentnumber] = true
      this.removeFromFailed(studentnumber)
    } else {
      if (this.failedBefore(studentnumber)) {
        this.students.failedMany[studentnumber] = true
      }
      this.students.failed[studentnumber] = true
    }
  }

  markGrade(grade, passingGrade, failingGrade, improvedGrade) {
    const gradecount = this.grades[grade] ? this.grades[grade].count || 0 : 0
    this.grades[grade] = { count: gradecount + 1, status: { passingGrade, improvedGrade, failingGrade } }
  }

  addCourseType(typecode, name) {
    this.course.coursetypes[typecode] = name
  }

  addCourseDiscipline(id, name) {
    this.course.disciplines[id] = name
  }

  getPassingSemestersCumulative() {
    const passingSemesters = this.stats.passingSemesters
    const cumulativeStats = {
      'BEFORE': passingSemesters['BEFORE']
    }

    cumulativeStats['0-FALL'] = passingSemesters['BEFORE'] + passingSemesters['0-FALL']
    cumulativeStats['0-SPRING'] = cumulativeStats['0-FALL'] + passingSemesters['0-SPRING']

    for (let i = 1; i < 7; i++) {
      cumulativeStats[`${i}-FALL`] = cumulativeStats[`${i - 1}-SPRING`] + passingSemesters[`${i}-FALL`]
      cumulativeStats[`${i}-SPRING`] = cumulativeStats[`${i}-FALL`] + passingSemesters[`${i}-SPRING`]
    }

    cumulativeStats['LATER'] = cumulativeStats['6-SPRING'] + passingSemesters['LATER']

    return cumulativeStats
  }

  getFinalStats() {
    const stats = this.stats
    const students = this.students

    stats.students = lengthOf(students.all)
    stats.passed = lengthOf(students.passed)
    stats.failed = lengthOf(students.failed)
    stats.failedMany = lengthOf(students.failedMany)
    stats.retryPassed = lengthOf(students.retryPassed)
    stats.improvedPassedGrade = lengthOf(students.improvedPassedGrade)
    stats.percentage = percentageOf(stats.passed, stats.students)
    stats.passedOfPopulation = percentageOf(stats.passed, this.studentsInTotal)
    stats.triedOfPopulation = percentageOf(stats.students, this.studentsInTotal)
    stats.perStudent = stats.attempts / (stats.passed + stats.failed)
    stats.passingSemestersCumulative = this.getPassingSemestersCumulative()

    return {
      stats,
      students,
      course: this.course,
      grades: this.grades
    }
  }

}

module.exports = {
  CourseStatsCounter
}