import { ExpandedCourseStats } from '@/redux/populations/util'
import { CourseStats } from '@oodikone/shared/routes/populations'
import { CreditTypeCode, EnrollmentState, FormattedStudent } from '@oodikone/shared/types'

type EnrollmentObject = {
  [EnrollmentState.ENROLLED]: string[]
  [EnrollmentState.REJECTED]: string[]
}

export type FilteredCourse = {
  attempts: number
  course: CourseStats
  enrollments: EnrollmentObject & {
    semesters: Record<string, EnrollmentObject>
  }
  grades: Record<
    string,
    {
      count: number
      status: {
        failingGrade: boolean
        improvedGrade: boolean
        passingGrade: boolean
      }
    }
  >
  stats: {
    attempts: number
    failed: number
    improvedPassedGrade: number
    passed: number
    passedOfPopulation: number
    passingSemesters: Record<string, number> // Key can also be BEFORE or LATER
    passingSemestersCumulative: Record<string, number>
    perStudent: number
    percentage: number
    percentageWithEnrollments: number
    students: number
    totalEnrolledNoGrade: number
    totalStudents: number
    triedOfPopulation: number
  }
  students: {
    all: string[]
    enrolledNoGrade: string[]
    failed: string[]
    improvedPassedGrade: string[]
    markedToSemester: string[]
    passed: string[]
  }
}

const percentageOf = (num: number, denom: number) => {
  if (denom === 0) {
    return 0
  }
  return Math.round(((100 * num) / denom) * 100) / 100
}

// courseStatsCounter legacy solution
const getCumulativePassingSemesters = (semesters: (typeof courseBaseStats)['stats']['passingSemesters']) => {
  const attemptStats: Record<string, number> = {}

  attemptStats.BEFORE = semesters.BEFORE
  attemptStats['0-FALL'] = semesters.BEFORE + semesters['0-FALL']
  attemptStats['0-SPRING'] = attemptStats['0-FALL'] + semesters['0-SPRING']

  for (let i = 1; i < 7; i++) {
    attemptStats[`${i}-FALL`] = attemptStats[`${i - 1}-SPRING`] + semesters[`${i}-FALL`]
    attemptStats[`${i}-SPRING`] = attemptStats[`${i}-FALL`] + semesters[`${i}-SPRING`]
  }

  attemptStats.LATER = attemptStats['6-SPRING'] + semesters.LATER

  return attemptStats
}

// courseStatsCounter legacy solution
const getFinalStats = (course, populationCount: number): FilteredCourse['stats'] => {
  const { students } = course

  const stats = { ...course.stats }

  stats.students = students.all.size
  stats.passed = students.passed.size
  stats.failed = students.failed.size
  stats.attempts = course.attempts
  stats.improvedPassedGrade = students.improvedPassedGrade.size
  stats.percentage = percentageOf(stats.passed, stats.students).toFixed(2)
  stats.passedOfPopulation = percentageOf(stats.passed, populationCount).toFixed(2)
  stats.triedOfPopulation = percentageOf(stats.students, populationCount).toFixed(2)
  stats.perStudent = (percentageOf(course.attempts, stats.passed + stats.failed) / 100).toFixed(2)
  stats.passingSemestersCumulative = getCumulativePassingSemesters(stats.passingSemesters)
  stats.totalStudents = stats.students
  stats.totalEnrolledNoGrade = students.enrolledNoGrade.size
  stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents).toFixed(2)

  return stats
}

const reconstructCourse = (course, populationCount: number): FilteredCourse => ({
  ...course,
  // courseStatsCounter legacy solution
  students: Object.fromEntries(
    Object.entries(course.students).map(([key, val]: [string, any]) => [
      key,
      Object.fromEntries(val.entries().map(n => [n, true])),
    ])
  ) as FilteredCourse['students'],
  stats: getFinalStats(course, populationCount),
})

import { dateDaysFromNow } from '@oodikone/shared/util/datetime'

const isSpring = (date: Date) => {
  return 0 <= date.getMonth() && date.getMonth() <= 6
}

const getSemester = (date: Date) => (isSpring(date) ? 'SPRING' : 'FALL')

const getPassingSemester = (startYear: number, initialDate: Date): string => {
  const date = dateDaysFromNow(initialDate, 1)
  const year = date.getFullYear()
  const semester = getSemester(date)
  const yearDiff = year - startYear
  const yearCount = semester === 'SPRING' ? yearDiff - 1 : yearDiff

  if (year < startYear || (semester === 'SPRING' && yearDiff <= 0)) {
    return 'BEFORE'
  }

  return yearCount < 6 ? `${yearCount}-${semester}` : 'LATER'
}

const courseBaseStats = {
  attempts: 0,
  enrollments: {
    [EnrollmentState.ENROLLED]: new Set<string>(),
    [EnrollmentState.REJECTED]: new Set<string>(),
    semesters: {
      BEFORE: {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '0-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '0-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '1-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '1-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '2-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '2-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '3-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '3-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '4-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '4-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '5-FALL': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      '5-SPRING': {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
      LATER: {
        [EnrollmentState.ENROLLED]: new Set<string>(),
        [EnrollmentState.REJECTED]: new Set<string>(),
      },
    },
  },
  grades: {},
  students: {
    all: new Set<string>(),
    passed: new Set<string>(),
    failed: new Set<string>(),
    improvedPassedGrade: new Set<string>(),
    markedToSemester: new Set<string>(),
    enrolledNoGrade: new Set<string>(),
  },
  stats: {
    passingSemesters: {
      BEFORE: 0,
      '0-FALL': 0,
      '0-SPRING': 0,
      '1-FALL': 0,
      '1-SPRING': 0,
      '2-FALL': 0,
      '2-SPRING': 0,
      '3-FALL': 0,
      '3-SPRING': 0,
      '4-FALL': 0,
      '4-SPRING': 0,
      '5-FALL': 0,
      '5-SPRING': 0,
      LATER: 0,
    },
  },
}

export const filterCourses = (
  courseStatistics: ExpandedCourseStats | undefined,
  filteredStudents: FormattedStudent[]
): FilteredCourse[] => {
  if (!courseStatistics) return []
  const { courses, credits, enrollments } = courseStatistics

  const fstudents = new Set(filteredStudents.map(({ studentNumber }) => studentNumber))
  const startingYear = new Map(
    filteredStudents.map(({ studentNumber, studyrightStart }) => [studentNumber, studyrightStart])
  )
  const coursestats = new Map(courses.map(course => [course.code, { course, ...structuredClone(courseBaseStats) }]))

  for (const enrollment of enrollments) {
    const { course_code, studentnumber, state, enrollment_date_time } = enrollment
    if (!fstudents.has(studentnumber)) continue

    // We cannot display these
    if (course_code === null) continue
    const course = coursestats.get(course_code)
    if (!course) continue

    const initialDate = new Date(enrollment_date_time)
    const semester = getPassingSemester(new Date(startingYear.get(studentnumber)!).getFullYear(), initialDate)

    course.students.all.add(studentnumber)
    course.students.enrolledNoGrade.add(studentnumber)
    course.enrollments[state].add(studentnumber)
    course.enrollments.semesters[semester][state].add(studentnumber)
  }

  for (const credit of credits) {
    const { course_code, student_studentnumber: studentnumber, grade, attainment_date: date } = credit
    if (!fstudents.has(studentnumber)) continue

    // We cannot display these
    if (course_code === null) continue
    const course = coursestats.get(course_code)
    if (!course) continue

    const passingGrade = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credit.credittypecode)
    const failingGrade = credit.credittypecode === CreditTypeCode.FAILED
    const improvedGrade = credit.credittypecode === CreditTypeCode.IMPROVED

    course.attempts += 1
    const gradeCount = course.grades[grade]?.count ?? 0
    course.grades[grade] = { count: gradeCount + 1, status: { passingGrade, failingGrade, improvedGrade } }

    course.students.all.add(studentnumber)
    course.students.enrolledNoGrade.delete(studentnumber)
    if (passingGrade) {
      if (!course.students.markedToSemester.has(studentnumber)) {
        course.students.markedToSemester.add(studentnumber)

        const semester = getPassingSemester(2017, new Date(date))
        course.stats.passingSemesters[semester]++
      }

      course.students.passed.add(studentnumber)
      course.students.failed.delete(studentnumber)
    } else if (improvedGrade) {
      course.students.improvedPassedGrade.add(studentnumber)
      course.students.passed.add(studentnumber)
      course.students.failed.delete(studentnumber)
    } else if (failingGrade && !course.students.passed.has(studentnumber)) {
      course.students.failed.add(studentnumber)
    }
  }

  return Array.from(coursestats.values()).map(course => reconstructCourse(course, filteredStudents.length))
}
