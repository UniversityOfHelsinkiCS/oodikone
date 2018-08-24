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
        programmes: {),
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
  constructor() {
    // this.semesterCredits = semesterCredits,
    // this.creditsUntilSemester = creditsUntilSemester,
    this.programmes = {

    }
    this.attempts = {
      grades: {
        all: {}
      },
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

  calculateStats(thisSemester, allInstancesUntilSemester) {
    this.setProgrammesFromStats(thisSemester)
    // ensin generoitaan programmit
    // sitten työnnetään dataa niin saatanasti, ensin kaikkiin, sitten opiskelijaan liittyvään
    // programmiin
    this.setPassedStudents(thisSemester)
  }

  setPassedAttempts(thisSemester) {
    const studentsThatPassedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.passed).map(c => c.student))))
    studentsThatPassedThisYear.map(student => {
      this.attempts.passed.all.push(student.studentnumber)
      student.studyright_elements.forEach(el => {
        this.attempts.passed[el.code] ?
          this.attempts.passed[el.code].push(student.studentnumber) :
          this.attempts.passed[el.code] = [student.studentnumber]
      })
    })
    console.log(this.attempts.passed)
  }

  setProgrammesFromStats(thisSemester) {
    _.flattenDeep(thisSemester
      .map(inst => inst.credits.map(cr => cr.student.studyright_elements))).map(cr => {
      Object.keys(this.programmes).includes(cr.code) ?
        this.programmes[cr.code].amount = this.programmes[cr.code].amount + 1 :
        this.programmes[cr.code] = {
          name: cr.element_detail.name,
          amount: 1
        }
    })
    console.log(this.programmes)
  }
}

module.exports = { CourseYearlyStatsCounter }