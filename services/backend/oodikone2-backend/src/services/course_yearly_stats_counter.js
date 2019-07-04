const CATEGORY = {
  FAIL_FIRST: 'failedFirst',
  PASS_FIRST: 'passedFirst',
  FAIL_RETRY: 'failedRetry',
  PASS_RETRY: 'passedRetry'
}

class CourseYearlyStatsCounter {

  constructor() {
    this.all = []
    this.groups = {}
    this.programmes = {}
    this.history = {
      passed: new Set(),
      failed: new Set(),
      attempts: new Set()
    }
  }

  initProgramme(code, name) {
    this.programmes[code] = { name, students: [] }
  }

  initGroup(groupcode, name) {
    this.groups[groupcode] = {
      code: groupcode,
      name,
      attempts: {
        grades: {},
        classes: {
          passed: [],
          failed: []
        }
      },
      students: {}
    }
  }

  studentHistory(studentnumber) {
    const attempted = this.history.attempts.has(studentnumber)
    const passed = this.history.passed.has(studentnumber)
    const failed = this.history.failed.has(studentnumber)
    return { attempted, passed, failed }
  }

  markStudyProgramme(code, name, studentnumber) {
    if (!this.programmes[code]) {
      this.initProgramme(code, name)
    }
    const prog = this.programmes[code]

    if (!prog.students.includes(studentnumber) && !this.all.includes(studentnumber)) {
      this.all.push(studentnumber)
      prog.students.push(studentnumber)
    }
  }

  markStudyProgrammes(studentnumber, programmes) {
    programmes.forEach(({ code, name }) => {
      this.markStudyProgramme(code, name, studentnumber)
    })
  }

  markCreditToHistory(studentnumber, passed) {
    const passedBefore = this.history.passed.has(studentnumber)
    if (!passedBefore) {
      this.history.attempts.add(studentnumber)
      if (passed) {
        this.history.passed.add(studentnumber)
        this.history.failed.delete(studentnumber)
      } else {
        this.history.failed.add(studentnumber)
      }
    }
  }

  getCreditCategory(studentnumber, passed, attempted) {
    if (!attempted) {
      return passed ? CATEGORY.PASS_FIRST : CATEGORY.FAIL_FIRST
    } else {
      return passed ? CATEGORY.PASS_RETRY : CATEGORY.FAIL_RETRY
    }
  }

  markCreditToStudents(studentnumber, passed, grade, groupcode) {
    const { students } = this.groups[groupcode]
    const { attempted } = this.studentHistory(studentnumber)
    const category = this.getCreditCategory(studentnumber, passed, attempted)
    const student = students[studentnumber]
    if (!student || passed || student.failed) {
      students[studentnumber] = { passed, category, grade }
    }
  }

  markCreditToGroup(studentnumber, passed, grade, groupcode, groupname) {
    if (!this.groups[groupcode]) {
      this.initGroup(groupcode, groupname)
    }
    this.markCreditToStudents(studentnumber, passed, grade, groupcode)
    this.markCreditToAttempts(studentnumber, passed, grade, groupcode)
    this.markCreditToHistory(studentnumber, passed)
  }

  markCreditToAttempts(studentnumber, passed, grade, groupcode) {
    const { attempts } = this.groups[groupcode]
    const { grades, classes } = attempts
    if (!grades[grade]) {
      grades[grade] = []
    }
    grades[grade].push(studentnumber)
    if (passed) {
      classes.passed.push(studentnumber)
    } else {
      classes.failed.push(studentnumber)
    }
  }

  formatStudentStatistics(students) {
    const grades = {}
    const classes = {}
    Object.entries(students).forEach(([studentnumber, stat]) => {
      const { grade, category } = stat
      grades[grade] = grades[grade] ? grades[grade].concat(studentnumber) : [studentnumber]
      classes[category] = classes[category] ? classes[category].concat(studentnumber) : [studentnumber]
    })
    return { grades, classes }
  }

  formatGroupStatistics() {
    return Object.values(this.groups).map(({ students, ...rest }) => ({
      ...rest,
      students: this.formatStudentStatistics(students)
    }))
  }

  getFinalStatistics() {
    return {
      programmes: this.programmes,
      statistics: this.formatGroupStatistics()
    }
  }

}

module.exports = { CourseYearlyStatsCounter, CATEGORY }