const lengthOf = obj => Object.keys(obj).length
const percentageOf = (num, denom) => Math.round(((100 * num) / denom) * 100) / 100

const fall = []
const spring = []
for (let i = 0; i < 7; i++) {
  fall[i] = `${i}-FALL`
  spring[i] = `${i}-SPRING`
}

class CourseStatsCounter {
  constructor(code, name, studentsInTotal) {
    this.studentsInTotal = studentsInTotal
    this.course = {
      code,
      name,
      disciplines: {},
      coursetypes: {},
      substitutions: [],
    }
    this.students = {
      all: {},
      passed: {},
      failed: {},
      retryPassed: {},
      failedMany: {},
      improvedPassedGrade: {},
      markedToSemester: {},
      enrolledNoGrade: {},
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
      perStudent: undefined,
      passingSemesters: this.initializePassingSemesters(),
    }
    this.enrollments = {
      semesters: this.initializePassingSemesters({}),
    }
    this.grades = {}
  }

  initializePassingSemesters(initialValue = 0) {
    const passingSemesters = {
      BEFORE: initialValue,
      LATER: initialValue,
    }

    for (let i = 0; i < 7; i++) {
      passingSemesters[fall[i]] = initialValue
      passingSemesters[spring[i]] = initialValue
    }

    return passingSemesters
  }

  markAttempt() {
    this.stats.attempts = this.stats.attempts + 1
  }

  markToAll(studentnumber) {
    this.students.all[studentnumber] = true
  }

  markPassedSemester(semester) {
    this.stats.passingSemesters[semester]++
  }

  markToSemester(studentnumber) {
    this.students.markedToSemester[studentnumber] = true
  }

  markCredit(studentnumber, grade, passed, failed, improved, semester) {
    // studentnumber = `${shajs('sha256').update(process.env.key + studentnumber).digest('hex')}`
    this.markAttempt()
    this.markGrade(grade, passed, failed, improved)
    this.markToAll(studentnumber)
    if (passed) {
      if (!this.students.markedToSemester[studentnumber]) {
        this.markPassedSemester(semester)
        this.markToSemester(studentnumber)
      }
      this.markPassingGrade(studentnumber)
    } else if (improved) {
      this.markImprovedGrade(studentnumber)
    } else if (failed) {
      this.markFailedGrade(studentnumber)
    }
  }

  markEnrollment(studentnumber, state, semester) {
    if (!this.enrollments[state]) this.enrollments[state] = new Set()
    this.enrollments[state].add(studentnumber)
    if (!this.enrollments.semesters[semester][state]) this.enrollments.semesters[semester][state] = new Set()
    this.enrollments.semesters[semester][state].add(studentnumber)
  }

  failedBefore(studentnumber) {
    return this.students.failed[studentnumber] !== undefined
  }

  passedBefore(studentnumber) {
    return this.students.passed[studentnumber] !== undefined
  }

  removeFromFailed(studentnumber) {
    delete this.students.failed[studentnumber]
    delete this.students.failedMany[studentnumber]
  }

  removeFromPassed(studentnumber) {
    delete this.students.passed[studentnumber]
  }

  markPassingGrade(studentnumber) {
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

  addCourseSubstitutions(subs) {
    this.course.substitutions = subs
  }

  addCourseDiscipline(id, name) {
    this.course.disciplines[id] = name
  }

  getPassingSemestersCumulative() {
    const passingSemesters = this.stats.passingSemesters
    const attemptStats = {
      BEFORE: passingSemesters['BEFORE'],
    }

    attemptStats['0-FALL'] = passingSemesters['BEFORE'] + passingSemesters['0-FALL']
    attemptStats['0-SPRING'] = attemptStats['0-FALL'] + passingSemesters['0-SPRING']

    for (let i = 1; i < 7; i++) {
      attemptStats[fall[i]] = attemptStats[spring[i - 1]] + passingSemesters[fall[i]]
      attemptStats[spring[i]] = attemptStats[fall[i]] + passingSemesters[spring[i]]
    }

    attemptStats['LATER'] = attemptStats['6-SPRING'] + passingSemesters['LATER']

    return attemptStats
  }

  getFinalStats() {
    const stats = this.stats
    const students = this.students
    const studs = this.enrollments
      ? Object.keys(this.enrollments)
          .filter(key => key !== 'ENROLLED' && key !== 'semesters')
          .reduce((acc, key) => [...acc, ...[...this.enrollments[key]].map(studentnumber => studentnumber)], [])
      : []
    const allStudents = Object.keys(students.all).map(student => student)
    const fileredEnrolledNoGrade = this.enrollments['ENROLLED']
      ? [...this.enrollments['ENROLLED']]
          .filter(student => !studs.includes(student) && !allStudents.includes(student))
          .reduce((acc, student) => ({ ...acc, [student]: true }), {})
      : {}

    students.all = { ...students.all, ...fileredEnrolledNoGrade }
    students.enrolledNoGrade = fileredEnrolledNoGrade
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
    stats.totalStudents = stats.students
    stats.totalEnrolledNoGrade = lengthOf(fileredEnrolledNoGrade)
    stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents)

    return {
      stats,
      students,
      course: this.course,
      grades: this.grades,
    }
  }
}

module.exports = {
  CourseStatsCounter,
}
