import { max, min } from 'lodash'

import { Name } from '../../shared/types'
import { getSemesterNameByCode } from '../semesters'
import { FormattedProgramme, OrganizationDetails } from './helpers'

type Programme = {
  name: Name
  students: { [yearCode: number]: string[] }
  passed: { [yearCode: number]: string[] }
  credits: { [yearCode: number]: number }
}

type Faculty = {
  name: Name | null
  students: string[]
  passed: string[]
  credits: number
}

type FacultyYearStats = {
  year: string
  allStudents: string[]
  allPassed: string[]
  faculties: { [facultyCode: string]: Faculty }
  allCredits: number
}

type Grades = { [grade: string]: string[] }

type GroupAttempts = {
  grades: Grades
  categories: {
    passed: string[]
    failed: string[]
  }
}

type GroupStudents = {
  grades: { [studentNumber: string]: { grade: string; passed: boolean } }
  studentNumbers: string[]
}

type Group = {
  code: number
  name: string | Name
  coursecode: string
  attempts: GroupAttempts
  students: GroupStudents
  enrollments: { studentNumber: string; enrollmentDateTime: Date }[]
  allEnrollments: { studentNumber: string; enrollmentDateTime: Date }[]
  yearCode: number
}

type Student = {
  earliestAttainment: Date
  code: number
}

export class CourseYearlyStatsCounter {
  private groups: { [groupCode: number]: Group }
  private programmes: { [code: string]: Programme }
  private facultyStats: { [yearCode: number]: FacultyYearStats }
  private obfuscated: boolean
  private students: Map<string, Student>

  constructor() {
    this.groups = {}
    this.programmes = {}
    this.facultyStats = {}
    this.obfuscated = false
    this.students = new Map()
  }

  private initProgramme(code: string, name: Name) {
    this.programmes[code] = {
      name,
      students: {},
      passed: {},
      credits: {},
    }
  }

  private initFacultyYear(code: number) {
    const year = `${1949 + Number(code)}-${1950 + Number(code)}`
    this.facultyStats[code] = {
      year,
      allStudents: [],
      allPassed: [],
      faculties: {},
      allCredits: 0,
    }
  }

  private initFaculty(yearCode: number, facultyCode: string, organization: OrganizationDetails | null) {
    this.facultyStats[yearCode].faculties[facultyCode] = {
      name: organization ? organization.name : null,
      students: [],
      passed: [],
      credits: 0,
    }
  }

  private initGroup(groupCode: number, name: string | Name, courseCode: string, yearCode: number) {
    this.groups[groupCode] = {
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
    code: string,
    name: Name,
    studentNumber: string,
    yearCode: number,
    passed: boolean,
    credits: number,
    facultyCode: string | null,
    organization: OrganizationDetails | null
  ) {
    if (!this.programmes[code]) {
      this.initProgramme(code, name)
    }
    if (!this.facultyStats[yearCode]) {
      this.initFacultyYear(yearCode)
    }
    if (
      facultyCode &&
      !this.facultyStats[yearCode].faculties[facultyCode] &&
      !this.facultyStats[yearCode].allPassed.includes(studentNumber)
    ) {
      this.initFaculty(yearCode, facultyCode, organization)
    }

    this.programmes[code].students[yearCode] = this.programmes[code].students[yearCode] || []
    this.programmes[code].students[yearCode].push(studentNumber)

    if (!this.programmes[code].passed[yearCode]) {
      this.programmes[code].passed[yearCode] = []
      this.programmes[code].credits[yearCode] = 0
    }
    if (facultyCode && !this.facultyStats[yearCode].allStudents.includes(studentNumber)) {
      this.facultyStats[yearCode].allStudents.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].students.push(studentNumber)
    }
    if (passed && !this.programmes[code].passed[yearCode].includes(studentNumber)) {
      this.programmes[code].passed[yearCode].push(studentNumber)
      this.programmes[code].credits[yearCode] += credits
    }
    if (facultyCode && passed && !this.facultyStats[yearCode].allPassed.includes(studentNumber)) {
      this.facultyStats[yearCode].allPassed.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].passed.push(studentNumber)
      this.facultyStats[yearCode].faculties[facultyCode].credits += credits
      this.facultyStats[yearCode].allCredits += credits
    }
  }

  public markStudyProgrammes(
    studentNumber: string,
    programmes: FormattedProgramme[],
    yearCode: number,
    passed: boolean,
    credits: number
  ) {
    programmes.forEach(({ code, name, facultyCode, organization }) => {
      this.markStudyProgramme(code, name, studentNumber, yearCode, passed, credits, facultyCode, organization)
    })
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
    if (!this.groups[groupCode]) {
      this.initGroup(groupCode, groupName, courseCode, yearCode)
    }
    this.markCreditToAttempts(studentNumber, passed, grade, groupCode)
    this.markBestEffortGrade(studentNumber, passed, grade, groupCode)
  }

  public markEnrollmentToGroup(
    studentNumber: string,
    enrollmentDateTime: Date,
    groupCode: number,
    groupName: string | Name,
    courseCode: string,
    yearCode: number
  ) {
    if (!this.groups[groupCode]) {
      this.initGroup(groupCode, groupName, courseCode, yearCode)
    }
    const enrollment = { studentNumber, enrollmentDateTime }
    this.groups[groupCode].allEnrollments.push(enrollment)
    const oldEnrollment = this.groups[groupCode].enrollments.find(
      enrollment => enrollment.studentNumber === studentNumber
    )
    if (!oldEnrollment) {
      return this.groups[groupCode].enrollments.push({ studentNumber, enrollmentDateTime })
    }
    this.groups[groupCode].enrollments = this.groups[groupCode].enrollments
      .filter(enrollment => enrollment.studentNumber !== studentNumber)
      .concat([enrollment])
  }

  private markCreditToAttempts(studentNumber: string, passed: boolean, grade: string, groupCode: number) {
    const { attempts } = this.groups[groupCode]
    const { grades, categories } = attempts
    if (!grades[grade]) {
      grades[grade] = []
    }
    grades[grade].push(studentNumber)
    if (passed) {
      categories.passed.push(studentNumber)
    } else {
      categories.failed.push(studentNumber)
    }
  }

  private markBestEffortGrade(studentNumber: string, passed: boolean, grade: string, groupCode: number) {
    const current = this.groups[groupCode].students.grades[studentNumber]
    if (!current) {
      this.groups[groupCode].students.grades[studentNumber] = { grade, passed }
      return
    }
    if (current.passed && !passed) {
      return
    }
    if (current.passed && Number(current.grade) >= Number(grade)) {
      return
    }
    this.groups[groupCode].students.grades[studentNumber] = { grade, passed }
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
    if (attainmentDate < student!.earliestAttainment) {
      this.addOrUpdateStudent(studentNumber, attainmentDate, groupCode)
    }
  }

  private parseProgrammeStatistics(anonymizationSalt: string | null) {
    if (anonymizationSalt) {
      this.programmes = {
        '000000': {
          name: { en: '', fi: '', sv: '' },
          credits: {},
          passed: {},
          students: {},
        },
      }
    }
    return this.programmes
  }

  private insertEmptyRows = async () => {
    const first = min(Object.keys(this.groups).map(Number))
    const last = max(Object.keys(this.groups).map(Number))
    if (!(first && last)) {
      return
    }

    const getNextYear = (name: string) => {
      const years = name.split('-')
      const startYear = parseInt(years[0], 10) + 1
      const endYear = parseInt(years[1], 10) + 1
      return `${startYear}-${endYear}`
    }

    for (let i = first + 1; i <= last; i++) {
      if (this.groups[i]) {
        continue
      }

      const previous = this.groups[i - 1]
      const semester = await getSemesterNameByCode(i)
      const name = typeof previous.name === 'string' ? getNextYear(previous.name) : semester.name
      this.initGroup(i, name, this.groups[i - 1].coursecode, i)
    }
  }

  private async parseGroupStatistics(anonymizationSalt: string | null) {
    for (const [studentNumber, data] of this.students) {
      this.groups[data.code].students.studentNumbers.push(studentNumber)
    }

    await this.insertEmptyRows()

    const groupStatistics = Object.values(this.groups).map(({ ...rest }) => {
      const { students } = rest
      const grades = {} as Grades
      Object.keys(students.grades).forEach(student => {
        const { grade, passed } = students.grades[student]
        const parsedGrade = passed ? grade : '0'
        if (!grades[parsedGrade]) {
          grades[parsedGrade] = []
        }
        grades[parsedGrade].push(student)
      })
      const normalStats = {
        ...rest,
        students: { ...students, grades },
      }
      if (anonymizationSalt && normalStats.students.studentNumbers.length < 6) {
        this.obfuscated = true
        const gradeSpread = {} as Grades
        for (const grade of Object.keys(normalStats.attempts.grades)) {
          gradeSpread[grade] = []
        }
        const obfuscatedStats = {
          obfuscated: true,
          code: rest.code,
          name: rest.name,
          coursecode: rest.coursecode,
          attempts: {
            categories: {
              failed: [] as string[],
              passed: [] as string[],
            },
            grades: gradeSpread,
          },
          yearCode: rest.yearCode,
          students: {
            studentNumbers: [] as string[],
          },
        }
        return obfuscatedStats
      }
      return normalStats
    })

    return groupStatistics
  }

  private parseFacultyStatistics(anonymizationSalt: string | null) {
    if (anonymizationSalt) {
      this.facultyStats = [
        {
          year: 'NA',
          allCredits: 0,
          allPassed: [],
          allStudents: [],
          faculties: {},
        },
      ]
    }
    return this.facultyStats
  }

  public async getFinalStatistics(anonymizationSalt: string | null) {
    return {
      programmes: this.parseProgrammeStatistics(anonymizationSalt),
      statistics: await this.parseGroupStatistics(anonymizationSalt),
      facultyStats: this.parseFacultyStatistics(anonymizationSalt),
      obfuscated: this.obfuscated,
    }
  }
}
