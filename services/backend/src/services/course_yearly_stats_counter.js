class CourseYearlyStatsCounter {
  constructor() {
    this.groups = {}
    this.programmes = {}
    this.facultyStats = {}
    this.obfuscated = false
    this.students = new Map()
  }

  initProgramme(code, name) {
    this.programmes[code] = { name, students: {}, passed: {}, credits: {} }
  }

  initFacultyYear(code) {
    const year = `${1949 + Number(code)}-${1950 + Number(code)}`
    this.facultyStats[code] = { year, allStudents: [], allPassed: [], faculties: {}, allCredits: 0 }
  }

  initFaculty(yearcode, faculty_code, organization) {
    this.facultyStats[yearcode].faculties[faculty_code] = {
      name: organization.name,
      students: [],
      passed: [],
      credits: 0
    }
  }

  initGroup(groupcode, name, coursecode, yearcode) {
    this.groups[groupcode] = {
      code: groupcode,
      name,
      coursecode,
      attempts: {
        grades: {},
        categories: {
          passed: [],
          failed: []
        }
      },
      students: {
        categories: {
          passedFirst: [],
          passedEventually: [],
          neverPassed: []
        },
        studentnumbers: []
      },
      yearcode
    }
  }

  markStudyProgramme(code, name, studentnumber, yearcode, passed, credit, faculty_code, organization) {
    if (!this.programmes[code]) {
      this.initProgramme(code, name)
    }
    if (!this.facultyStats[yearcode]) {
      this.initFacultyYear(yearcode)
    }

    if (faculty_code && !this.facultyStats[yearcode].faculties[faculty_code]) {
      this.initFaculty(yearcode, faculty_code, organization)
    }

    this.programmes[code].students[yearcode] = this.programmes[code].students[yearcode] || []
    this.programmes[code].students[yearcode].push(studentnumber)

    if (!this.programmes[code].passed[yearcode]) {
      this.programmes[code].passed[yearcode] = []
      this.programmes[code].credits[yearcode] = 0
    }

    if (faculty_code && !this.facultyStats[yearcode].allStudents.includes(studentnumber)) {
      this.facultyStats[yearcode].allStudents.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].students.push(studentnumber)
    }
    if (passed && !this.programmes[code].passed[yearcode].includes(studentnumber)) {
      this.programmes[code].passed[yearcode].push(studentnumber)
      this.programmes[code].credits[yearcode] += credit
    }

    if (faculty_code && passed && !this.facultyStats[yearcode].allPassed.includes(studentnumber)) {
      this.facultyStats[yearcode].allPassed.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].passed.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].credits += credit
      this.facultyStats[yearcode].allCredits += credit
    }
  }

  markStudyProgrammes(studentnumber, programmes, yearcode, passed, credit) {
    programmes.forEach(({ code, name, faculty_code, organization }) => {
      this.markStudyProgramme(code, name, studentnumber, yearcode, passed, credit, faculty_code, organization)
    })
  }

  markCreditToGroup(studentnumber, passed, grade, groupcode, groupname, coursecode, yearcode) {
    if (!this.groups[groupcode]) {
      this.initGroup(groupcode, groupname, coursecode, yearcode)
    }
    this.markCreditToAttempts(studentnumber, passed, grade, groupcode)
  }

  markCreditToAttempts(studentnumber, passed, grade, groupcode) {
    const { attempts } = this.groups[groupcode]
    const { grades, categories } = attempts
    if (!grades[grade]) {
      grades[grade] = []
    }
    grades[grade].push(studentnumber)
    if (passed) {
      categories.passed.push(studentnumber)
    } else {
      categories.failed.push(studentnumber)
    }
  }

  markCreditToStudentCategories(studentnumber, passed, attainment_date, groupcode) {
    if (!this.students.has(studentnumber)) {
      if (passed) {
        this.students.set(studentnumber, {
          earliestAttainment: attainment_date,
          category: 'passedFirst',
          code: groupcode
        })
      } else {
        this.students.set(studentnumber, {
          earliestAttainment: attainment_date,
          category: 'neverPassed',
          code: groupcode
        })
      }
    } else {
      const student = this.students.get(studentnumber)
      if (attainment_date < student.earliestAttainment) {
        if (passed) {
          this.students.set(studentnumber, {
            earliestAttainment: attainment_date,
            category: 'passedFirst',
            code: groupcode
          })
        } else {
          if (student.category == 'passedFirst') {
            this.students.set(studentnumber, {
              earliestAttainment: attainment_date,
              category: 'passedEventually',
              code: groupcode
            })
          }
        }
      } else {
        if (student.category === 'neverPassed') {
          if (passed) {
            this.students.set(studentnumber, { ...student, category: 'passedEventually' })
          }
        }
      }
    }
  }

  parseProgrammeStatistics(anonymizationSalt) {
    if (anonymizationSalt) {
      this.programmes = {
        '000000': {
          name: { en: '', fi: '', sv: '' },
          credits: {},
          passed: {},
          students: {}
        }
      }
    }

    return this.programmes
  }

  parseGroupStatistics(anonymizationSalt) {
    for (const [studentnumber, data] of this.students) {
      this.groups[data.code].students.categories[data.category].push(studentnumber)
      this.groups[data.code].students.studentnumbers.push(studentnumber)
    }

    const groupStatistics = Object.values(this.groups).map(({ ...rest }) => {
      const normalStats = {
        ...rest
      }

      if (anonymizationSalt && normalStats.students.studentnumbers.length < 6) {
        // indicate to the front that some of the data has been obfuscated and therefore
        // totals cannot be calculated
        this.obfuscated = true

        let gradeSpread = {}
        for (const grade in normalStats.attempts.grades) {
          gradeSpread[grade] = []
        }

        const obfuscatedStats = {
          obfuscated: true,
          code: rest.code,
          name: rest.name,
          coursecode: rest.coursecode,
          attempts: {
            categories: {
              failed: [],
              passed: []
            },
            grades: gradeSpread
          },
          yearcode: rest.yearcode,
          students: {
            categories: {
              passedFirst: [],
              passedEventually: [],
              neverPassed: []
            },
            studentnumbers: []
          }
        }
        return obfuscatedStats
      }
      return normalStats
    })

    return groupStatistics
  }

  parseFacultyStatistics(anonymizationSalt) {
    if (anonymizationSalt) {
      this.facultyStats = [
        {
          year: 'NA',
          allCredits: 0,
          allPassed: [],
          allStudents: [],
          faculties: {}
        }
      ]
    }
    return this.facultyStats
  }

  getFinalStatistics(anonymizationSalt) {
    return {
      programmes: this.parseProgrammeStatistics(anonymizationSalt),
      statistics: this.parseGroupStatistics(anonymizationSalt),
      facultyStats: this.parseFacultyStatistics(anonymizationSalt),
      obfuscated: this.obfuscated
    }
  }
}

module.exports = { CourseYearlyStatsCounter }
