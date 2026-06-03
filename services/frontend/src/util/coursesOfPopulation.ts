import { ExpandedCourseStats } from '@/redux/populations/util'
import { CourseStats } from '@oodikone/shared/routes/populations'
import {
  CreditTypeCode,
  EnrollmentState,
  FormattedStudent,
  Module,
  Name,
  ProgrammeCourse,
} from '@oodikone/shared/types'
import { isSpring } from '@oodikone/shared/util'
import { dateDaysFromNow } from '@oodikone/shared/util/datetime'

type EnrollmentObject = {
  [EnrollmentState.ENROLLED]: Set<string>
  [EnrollmentState.REJECTED]: Set<string>
}

export type CourseModule = Pick<Module, 'code'> & {
  name: Name
  courses: FilteredProgrammeCourse[]
  stats?: Partial<FilteredCourseStats>
}
export type FilteredProgrammeCourse = FilteredCourse & ProgrammeCourse
type FilteredCourseModule = FilteredCourse & { name: Name; code: string }
export type UnionOfFilteredModuleCourse = (
  | (Omit<FilteredCourseModule, 'stats'> & { stats: Partial<FilteredCourseStats> })
  | CourseModule
)[]

type FilteredCourseStats = {
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
  stats: FilteredCourseStats
  students: {
    all: Set<string>
    enrolledNoGrade: Set<string>
    failed: Set<string>
    improvedPassedGrade: Set<string>
    markedToSemester: Set<string>
    passed: Set<string>
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
const getFinalStats = (
  { students, stats: courseStats, attempts },
  populationCount: number
): FilteredCourse['stats'] => ({
  ...courseStats,
  students: students.all.size,
  passed: students.passed.size,
  failed: students.failed.size,
  attempts,
  improvedPassedGrade: students.improvedPassedGrade.size,
  percentage: percentageOf(students.passed.size, students.all.size).toFixed(2),
  passedOfPopulation: percentageOf(students.passed.size, populationCount).toFixed(2),
  triedOfPopulation: percentageOf(students.all.size, populationCount).toFixed(2),
  perStudent: (percentageOf(attempts, students.passed.size + students.failed.size) / 100).toFixed(2),
  passingSemestersCumulative: getCumulativePassingSemesters(courseStats.passingSemesters),
  totalStudents: students.all.size,
  totalEnrolledNoGrade: students.enrolledNoGrade.size,
  percentageWithEnrollments: percentageOf(students.passed.size, students.all.size).toFixed(2),
})

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

  const coursestats = new Map(
    courseStatistics.courses.map(course => [course.code, { course, ...structuredClone(courseBaseStats) }])
  )

  for (const { studentNumber: studentnumber, studyrightStart, enrollments, courses } of filteredStudents) {
    const studentStartingYear = new Date(studyrightStart).getFullYear()

    for (const { course_code, state, enrollment_date_time } of enrollments) {
      // We cannot display these
      if (course_code === null) continue
      const course = coursestats.get(course_code)
      if (!course) continue

      const initialDate = new Date(enrollment_date_time)
      const semester = getPassingSemester(studentStartingYear, initialDate)

      course.students.all.add(studentnumber)
      course.students.enrolledNoGrade.add(studentnumber)
      course.enrollments[state].add(studentnumber)
      course.enrollments.semesters[semester][state].add(studentnumber)
    }

    for (const { course_code, grade, credittypecode, date } of courses) {
      // We cannot display these
      if (course_code === null) continue
      const course = coursestats.get(course_code)
      if (!course) continue

      const passingGrade = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credittypecode)
      const improvedGrade = credittypecode === CreditTypeCode.IMPROVED
      const failingGrade = credittypecode === CreditTypeCode.FAILED

      course.grades[grade] ??= {
        count: 0,
        status: {
          passingGrade,
          improvedGrade,
          failingGrade,
        },
      }

      course.attempts += 1
      course.grades[grade].count += 1

      course.students.all.add(studentnumber)
      course.students.enrolledNoGrade.delete(studentnumber)
      if (passingGrade) {
        if (!course.students.markedToSemester.has(studentnumber)) {
          const semester = getPassingSemester(studentStartingYear, new Date(date))
          course.stats.passingSemesters[semester]++
        }

        course.students.markedToSemester.add(studentnumber)
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
  }

  return Array.from(coursestats.values()).map(
    (course): FilteredCourse =>
      Object.assign(course, {
        stats: getFinalStats(course, filteredStudents.length),
      })
  )
}
