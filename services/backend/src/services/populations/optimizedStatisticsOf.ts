import { EnrollmentState } from '@oodikone/shared/types'
import { omitKeys } from '@oodikone/shared/util'
import { CreditModel } from '../../models'
import { getDegreeProgrammeType } from '../../util'
import { getPassingSemester } from '../../util/semester'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { formatStudentForAPI } from './formatStatisticsForApi'
import {
  type StudentEnrollment,
  type StudentCredit,
  getStudents,
  getEnrollments,
  getCredits,
  StudentTags,
} from './getStudentData'
import { getOptionsForStudents } from './shared'

export type OptimizedStatisticsQuery = {
  userId: string
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  years: string[]
}

export type AnonymousEnrollment = Omit<StudentEnrollment, 'studentnumber'>
export type AnonymousCredit = Omit<StudentCredit, 'student_studentnumber'>

export type StudentEnrollmentObject = Map<StudentEnrollment['studentnumber'], AnonymousEnrollment[]>
export type StudentCreditObject = Map<StudentCredit['student_studentnumber'], AnonymousCredit[]>

export const optimizedStatisticsOf = async (
  studentNumbers: string[],
  studyRights: string[],
  tagList: Record<string, StudentTags[]>,
  startDate?: string
) => {
  const mockedStartDate = startDate ?? new Date(1900).toISOString()

  const [students, enrollments, credits] = await Promise.all([
    getStudents(studentNumbers),
    getEnrollments(studentNumbers, mockedStartDate),
    getCredits(studentNumbers, studyRights, mockedStartDate),
  ])

  const defaultCourse = {
    attempts: 0,
    enrollments: {
      [EnrollmentState.ENROLLED]: new Set(),
      [EnrollmentState.REJECTED]: new Set(),
      semesters: {
        BEFORE: {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '0-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '0-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '1-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '1-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '2-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '2-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '3-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '3-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '4-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '4-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '5-FALL': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        '5-SPRING': {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
        LATER: {
          [EnrollmentState.ENROLLED]: new Set(),
          [EnrollmentState.REJECTED]: new Set(),
        },
      },
    },
    grades: {},
    credits: [],

    students: {
      all: new Set(),
      passed: new Set(),
      failed: new Set(),
      improvedPassedGrade: new Set(),
      markedToSemester: new Set(),
      enrolledNoGrade: new Set(),
    },

    stats: {
      passingSemester: {},
    },
  }

  const getYear = _ => 2017

  const coursestats = new Map<string, typeof defaultCourse>()
  for (const enrollment of enrollments) {
    const { course_code, studentnumber, state, enrollment_date_time } = enrollment

    if (!coursestats.has(course_code)) coursestats.set(course_code, structuredClone(defaultCourse))
    const course = coursestats.get(course_code)!

    const initialDate = new Date(enrollment_date_time)
    const semester = getPassingSemester(getYear(studentnumber), initialDate)

    course.enrollments[state].add(studentnumber)
    course.enrollments.semesters[semester][state].add(studentnumber)
  }

  for (const credit of credits) {
    const { course_code, student_studentnumber: studentnumber, grade, attainment_date: date } = credit
    const passingGrade = CreditModel.passed(credit)
    const failingGrade = CreditModel.failed(credit)
    const improvedGrade = CreditModel.improved(credit)

    if (!coursestats.has(course_code)) coursestats.set(course_code, structuredClone(defaultCourse))
    const course = coursestats.get(course_code)!

    course.attempts += 1
    const gradeCount = course.grades[grade]?.count ?? 0
    course.grades[grade] = { count: gradeCount + 1, status: { passingGrade, failingGrade, improvedGrade } }

    course.students.all.add(studentnumber)
    if (passingGrade) {
      if (!course.students.markedToSemester.has(studentnumber)) {
        course.students.markedToSemester.add(studentnumber)

        const semester = getPassingSemester(getYear(studentnumber), new Date(date))
        course.stats.passingSemester[semester] ??= 0
        course.stats.passingSemester[semester]++
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

  const formattedCoursestats = Array.from(coursestats.entries()).map(
    ([code, { attempts, enrollments, grades, credits, students, stats }]) => {
      return {
        course: {
          code,
          name: code,
        },
        attempts,
        enrollments: {
          [EnrollmentState.ENROLLED]: Array.from(enrollments[EnrollmentState.ENROLLED]),
          [EnrollmentState.REJECTED]: Array.from(enrollments[EnrollmentState.REJECTED]),
          semesters: Object.fromEntries(
            Object.entries(enrollments.semesters).map(([key, val]) => [
              key,
              {
                [EnrollmentState.ENROLLED]: Array.from(val[EnrollmentState.ENROLLED]),
                [EnrollmentState.REJECTED]: Array.from(val[EnrollmentState.REJECTED]),
              },
            ])
          ),
        },
        grades,
        credits,
        students: Object.fromEntries(Object.entries(students).map(([key, val]) => [key, Array.from(val)])),
        stats,
      }
    }
  )

  const creditsByStudent: StudentCreditObject = new Map<string, AnonymousCredit[]>(studentNumbers.map(n => [n, []]))
  const enrollmentsByStudent: StudentEnrollmentObject = new Map<string, AnonymousEnrollment[]>(
    studentNumbers.map(n => [n, []])
  )

  credits.forEach(credit =>
    creditsByStudent.get(credit.student_studentnumber)?.push(omitKeys(credit, ['student_studentnumber']))
  )
  enrollments.forEach(enrollment =>
    enrollmentsByStudent.get(enrollment.studentnumber)?.push(omitKeys(enrollment, ['studentnumber']))
  )

  const code = studyRights[0] ?? ''
  const criteria = await getCriteria(code)
  const optionData = await getOptionsForStudents(studentNumbers, code, await getDegreeProgrammeType(code))

  return {
    coursestatistics: formattedCoursestats,
    students: students.map(student =>
      formatStudentForAPI(
        { ...student, tags: tagList[student.studentnumber] },
        enrollmentsByStudent.get(student.studentnumber) ?? [],
        creditsByStudent.get(student.studentnumber) ?? [],
        mockedStartDate,
        criteria,
        code,
        optionData
      )
    ),
  }
}
