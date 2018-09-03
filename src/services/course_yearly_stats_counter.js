/**

OLD: 
Courses: [
    {
        code: ...,
        programmes: ...,
        years: [
            {
                info: ...,
                stats: {
                    programmes: { amount, ... },

                }
            }
        ]
    }
]

 */

/*
 
 NEW:
 Courses: [
    {
        code,
        alternative_codes,
        query: {},
        programmes: {
            id: {
            }
            name: {}
        },
        yearlystatistics: {
            id: {
                name,
                statistics: {
                    studentsThatPassed: [ ...{  }, ]
                }
                gradeDistribution: {
                    all: {},
                    5: [ ...studentnumbers ]
                }
            }
        }

    }
 ]
 

 EVEN NEWER

 Courses: [
     {
        ...courseinfo,
        programmes: {},
        yearlystats: {
            yearcode: {
                attempts: {
                    grades: {},
                    attempts: {
                        passed,
                        failed
                    }
                },
                students: {
                    grades: {},
                    attempts: { // these categories are mutually exclusive - student can only be in ONE of these groups. 
                        failedRetry: {}, // any credit before + failed now
                        failedFirst: {}, // no credit before + failed now
                        passedFirst: {}, // no credit before + passed now (if the student passes again this semester should be in raised grade.)
                        raisedGrade: {}  // 
                    }
                }
            } 
        }
     }
 ]


/*

"studentsThatPassedThisYear", 
"studentsThatFailedThisYear", 
"passedStudentsThatFailedBefore", 
"passedStudentsOnFirstTry", 
"failedStudentsThatFailedBefore", 
"failedStudentsOnFirstTry", 
"courseLevelPassed",
"courseLevelFailed"rl,
"gradeDistribution"

*/

const _ = require('lodash')
const { Credit } = require('../models')
const { plainPrint, plainify } = require('../util')


class CourseYearlyStatsCounter {
  constructor(thisSemester, allInstancesUntilSemester) {

    // helpers
    this.thisSemester = thisSemester // credits from current 
    this.allInstancesUntilSemester = allInstancesUntilSemester
    this.studentsPassedThisYear = {}
    this.studentsFailedThisYear = {}

    // values to return

    this.programmes = {

    }
    this.attempts = {
      grades: {},
      passed: {
        all: []
      },
      failed: {
        all: []
      }
    }
    this.students = {
      grades: {
        all: {}
      },
      attempts: {
        failedRetry: {
          all: {}

        },
        failedOnce: {
          all: {}

        },
        passedFirst: {
          all: {}
        },
        passedAfterFail: {
          all: {}
        }
      }
    },
    this.name = '',
    this.time = ''
  }

  calculateStats() {

    this.setPassedAndFailedStudents()
    this.setProgrammesFromStats()
    plainPrint(this.programmes)
    this.setAttemptGrades()
    this.setPassedAttempts()
    this.setFailedAttempts()
  }

  setPassedAndFailedStudents() {
    this.studentsPassedThisYear = _.uniq(_.flattenDeep(this.thisSemester.map(inst => inst.credits.filter(Credit.passed).map(c => c.student))))
    this.studentsFailedThisYear = _.uniq(_.flattenDeep(this.thisSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student))))

  }

  setAttemptGrades() {
    const allGrades = _.flattenDeep(this.thisSemester.map(inst => inst.credits))
    this.attempts.grades = allGrades.reduce((abr, attainment) => {
      abr.all[attainment.grade] ? abr.all[attainment.grade].push(attainment.student_studentnumber) : abr.all[attainment.grade] = [attainment.student_studentnumber]
      attainment.student.studyright_elements.forEach(el => {
        if(!abr[el.code]) abr[el.code] = {}
        abr[el.code][attainment.grade] ? abr[el.code][attainment.grade].push(attainment.student_studentnumber) : abr[el.code][attainment.grade] = [attainment.student_studentnumber]
      })
      return abr
    }, { all: {} })
  }

  setPassedAttempts() {
    this.studentsPassedThisYear.map(student => {
      this.attempts.passed.all.push(student.studentnumber)
      student.studyright_elements.forEach(el => {
        this.attempts.passed[el.code] ?
          this.attempts.passed[el.code].push(student.studentnumber) :
          this.attempts.passed[el.code] = [student.studentnumber]
      })
    })
  }

  setFailedAttempts() {
    this.studentsFailedThisYear.map(student => {
      this.attempts.failed.all.push(student.studentnumber)
      student.studyright_elements.forEach(el => {
        this.attempts.failed[el.code] ?
          this.attempts.failed[el.code].push(student.studentnumber) :
          this.attempts.failed[el.code] = [student.studentnumber]
      })
    })
  }

  setProgrammesFromStats() {
    _.flattenDeep(this.thisSemester
      .map(inst => inst.credits.map(cr => cr.student.studyright_elements))).map(cr => {
      Object.keys(this.programmes).includes(cr.code) ?
        this.programmes[cr.code].amount = this.programmes[cr.code].amount + 1 :
        this.programmes[cr.code] = {
          name: cr.element_detail.name,
          amount: 1
        }
    })
  }
}

module.exports = { CourseYearlyStatsCounter }