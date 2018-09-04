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
        ...courseinfo = {},
        programmes: {},
        yearlystats: {
            [yearcode/semestercode]: {
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
"courseLevelFailed",
"gradeDistribution"

*/


class CourseYearlyStatsCounter {
  constructor() {

    this.statistics = {}
    this.programmes = {}
    this.history = {
      passed: new Set(),
      failed: new Set(),
      attempts: new Set()
    }
  
    this.attempts = {
      grades: {},
      passed: [],
      failed: []
    }
    this.students = {
      grades: {},
      attempts: {
        failedRetry: {},
        failedFirst: {},
        passedFirst: {},
        raisedGrade: {}
      }
    }
  }

  initProgramme(code, name) {
    this.programmes[code] = { name, students: [] }
  }

  initGroup(groupcode) {
    this.statistics[groupcode] = {
      attempts: {
        grades: {},
        passed: [],
        failed: []
      },
      students: {
        grades: {},
        attempts: {
          failedRetry: {},
          failedFirst: {},
          passedFirst: {},
          raisedGrade: {}
        }
      }
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
    prog.students.push(studentnumber)
  }

  markCreditToHistory(studentnumber, passed, failed) {
    this.history.attempts.add(studentnumber)
    if (passed) {
      this.history.passed.add(studentnumber)
      this.history.failed.delete(studentnumber)
    }
    if (failed) {
      this.history.failed.add(studentnumber)
    }
  }

  markCreditToGroup(studentnumber, passed, failed, groupcode) {
    if (!this.statistics[groupcode]) {
      this.initGroup(groupcode)
    }
  }

}

module.exports = { CourseYearlyStatsCounter }