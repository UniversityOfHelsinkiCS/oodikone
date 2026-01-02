import type { Name } from '@oodikone/shared/types'
import type { Programme, FacultyYearStats, Grades, Group, Student } from '@oodikone/shared/types/courseYearlyStats'
import { getSemesterNamesByCode } from '../semesters'
import type { OrganizationDetails } from './helpers'

export class CourseYearlyStatsCounter {
  private groups: Record<number, Group>
  private programmes: Record<string, Programme>
  private facultyStats: Record<number, FacultyYearStats>
  private students: Map<string, Student>

  constructor() {
    this.groups = {}
    this.programmes = {}
    this.facultyStats = {}
    this.students = new Map()
  }

  private initGroup(groupCode: number, name: string | Name, courseCode: string, yearCode: number) {
    this.groups[groupCode] ??= {
      code: groupCode,
      name,
      coursecode: courseCode,
      attempts: {
        grades: {},
        categories: {
          passed: [],
          failed: [],
        },
      },
      students: {
        grades: {},
        studentNumbers: [],
      },
      enrollments: [],
      allEnrollments: [],
      yearCode,
    }
  }

  public markStudyProgramme(
    studentNumber: string,
    yearCode: number,
    passed: boolean,
    credits: number,
    code: string,
    name: Name,
    facultyCode: string,
    organization: OrganizationDetails
  ) {
    this.programmes[code] ??= {
      name,
      students: {},
      passed: {},
      credits: {},
    }

    const year = `${1949 + Number(yearCode)}-${1950 + Number(yearCode)}`
    this.facultyStats[yearCode] ??= {
      year,
      allStudents: [],
      allPassed: [],
      faculties: {},
      allCredits: 0,
    }

    this.facultyStats[yearCode].faculties[facultyCode] ??= {
      name: organization?.name ?? null,
      students: [],
      passed: [],
      credits: 0,
    }

    this.programmes[code].students[yearCode] ??= []
    this.programmes[code].students[yearCode].push(studentNumber)

    this.programmes[code].passed[yearCode] ??= []
    this.programmes[code].credits[yearCode] ??= 0

    if (!this.facultyStats[yearCode].allStudents.includes(studentNumber)) {
      this.facultyStats[yearCode].allStudents.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].students.push(studentNumber)
    }
    if (passed && !this.programmes[code].passed[yearCode].includes(studentNumber)) {
      this.programmes[code].passed[yearCode].push(studentNumber)
      this.programmes[code].credits[yearCode] += credits
    }
    if (passed && !this.facultyStats[yearCode].allPassed.includes(studentNumber)) {
      this.facultyStats[yearCode].allPassed.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].passed.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].credits += credits
      this.facultyStats[yearCode].allCredits += credits
    }
  }

  public markCreditToGroup(
    studentNumber: string,
    passed: boolean,
    grade: string,
    groupCode: number,
    groupName: string | Name,
    courseCode: string,
    yearCode: number
  ) {
    this.initGroup(groupCode, groupName, courseCode, yearCode)

    // mark credit to attempts
    const { grades, categories } = this.groups[groupCode].attempts

    grades[grade] ??= []
    grades[grade].push(studentNumber)

    if (passed) {
      categories.passed.push(studentNumber)
    } else {
      categories.failed.push(studentNumber)
    }

    // mark best effort grade
    const current = this.groups[groupCode].students.grades[studentNumber]

    if (current?.passed && !passed) return
    if (current?.passed && Number(grade) <= Number(current?.grade)) return
    this.groups[groupCode].students.grades[studentNumber] = { grade, passed }
  }

  public markEnrollmentToGroup(
    studentNumber: string,
    enrollmentDateTime: Date,
    groupCode: number,
    groupName: string | Name,
    courseCode: string,
    yearCode: number
  ) {
    this.initGroup(groupCode, groupName, courseCode, yearCode)
    const oldEnrollment = this.groups[groupCode].enrollments.some(
      enrollment => enrollment.studentNumber === studentNumber
    )

    const enrollment = { studentNumber, enrollmentDateTime }
    this.groups[groupCode].allEnrollments.push(enrollment)
    if (!oldEnrollment) {
      this.groups[groupCode].enrollments.push(enrollment)
    } else {
      this.groups[groupCode].enrollments = this.groups[groupCode].enrollments
        .filter(enrollment => enrollment.studentNumber !== studentNumber)
        .concat([enrollment])
    }
  }

  public markCreditToStudentCategories(studentNumber: string, attainmentDate: Date, groupCode: number) {
    if (!this.students.has(studentNumber)) {
      this.addOrUpdateStudent(studentNumber, attainmentDate, groupCode)
    } else {
      this.updateExistingStudent(studentNumber, attainmentDate, groupCode)
    }
  }

  private addOrUpdateStudent(studentNumber: string, attainmentDate: Date, groupCode: number) {
    this.students.set(studentNumber, {
      earliestAttainment: attainmentDate,
      code: groupCode,
    })
  }

  private updateExistingStudent(studentNumber: string, attainmentDate: Date, groupCode: number) {
    const student = this.students.get(studentNumber)
    if (attainmentDate < student!.earliestAttainment) this.addOrUpdateStudent(studentNumber, attainmentDate, groupCode)
  }

  private async insertEmptyRows() {
    const groups = Object.keys(this.groups).map(Number)
    if (groups.length === 0) return

    const first = Math.min(...groups)
    const last = Math.max(...groups)

    const a = first
    const b = last + 1
    const range = [...Array(b - a).keys()].map(v => v + a)
    const diff = range.filter(v => !groups.includes(v))

    const semesters = await getSemesterNamesByCode(diff)

    const getNextYear = (name: string) => {
      const [start, end] = name.split('-')
      const startYear = parseInt(start, 10) + 1
      const endYear = parseInt(end, 10) + 1
      return `${startYear}-${endYear}`
    }

    diff.forEach(i => {
      const previous = this.groups[i - 1]
      const name = typeof previous.name === 'string' ? getNextYear(previous.name) : semesters[i]

      this.initGroup(i, name, previous.coursecode, i)
    })
  }

  private async parseGroupStatistics(anonymizationSalt: string | null) {
    await this.insertEmptyRows()
    for (const [studentNumber, data] of this.students) {
      this.groups[data.code].students.studentNumbers.push(studentNumber)
    }

    const groupStatistics = Object.values(this.groups).map(group => {
      if (anonymizationSalt && group.students.studentNumbers.length < 6) {
        return {
          obfuscated: true,
          code: group.code,
          name: group.name,
          coursecode: group.coursecode,
          attempts: {
            categories: {
              failed: [] as string[],
              passed: [] as string[],
            },
            grades: Object.keys(group.attempts.grades).reduce<Grades>((grades, grade) => {
              grades[grade] = []
              return grades
            }, {}),
          },
          yearCode: group.yearCode,
          students: {
            studentNumbers: [] as string[],
          },
        }
      }

      return {
        ...group,
        students: {
          ...group.students,
          grades: Object.entries(group.students.grades)
            .map(([_, { grade, passed }]) => (passed ? grade : '0'))
            .reduce<Grades>((grades, [studentNumber, grade]) => {
              grades[grade] ??= []
              grades[grade].push(studentNumber)

              return grades
            }, {}),
        },
      }
    })

    return groupStatistics
  }

  private parseProgrammeStatistics(anonymizationSalt: string | null) {
    if (anonymizationSalt)
      return {
        '000000': {
          name: { en: '', fi: '', sv: '' },
          credits: {},
          passed: {},
          students: {},
        },
      }

    return this.programmes
  }

  private parseFacultyStatistics(anonymizationSalt: string | null) {
    if (anonymizationSalt)
      return {
        0: {
          year: 'NA',
          allCredits: 0,
          allPassed: [],
          allStudents: [],
          faculties: {},
        },
      }

    return this.facultyStats
  }

  public async getFinalStatistics(anonymizationSalt: string | null) {
    const statistics = await this.parseGroupStatistics(anonymizationSalt)
    const obfuscated = statistics.some(row => row.obfuscated)

    return {
      obfuscated,
      statistics,
      programmes: this.parseProgrammeStatistics(anonymizationSalt),
      facultyStats: this.parseFacultyStatistics(anonymizationSalt),
    }
  }
}
