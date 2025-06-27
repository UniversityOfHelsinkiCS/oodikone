import dayjs from 'dayjs'

import { SISStudyRightModel } from '../../models'
import { getCourseNames, getCredits, getEnrollments, getStudentInfo, getStudyRights } from './openUniSearches'

type CourseInfo = {
  status: {
    passed: Date | null
    failed: Date | null
    unfinished: Date | null
  }
}

type StudentStats = {
  [studentNumber: string]: {
    courseInfo: {
      [courseCode: string]: CourseInfo
    }
    email: string
    secondaryEmail: string
    totals: {
      passed: number
      failed: number
      unfinished: number
    }
  }
}

const uniq = objects => [...new Set(objects)]

const calculateTotalsForStudent = (studentStats: StudentStats, studentNumber: string) => {
  Object.keys(studentStats[studentNumber].courseInfo).forEach(course => {
    const { status } = studentStats[studentNumber].courseInfo[course]
    if (status.passed) {
      studentStats[studentNumber].totals.passed += 1
    } else if (status.failed) {
      studentStats[studentNumber].totals.failed += 1
    } else if (status.unfinished) {
      studentStats[studentNumber].totals.unfinished += 1
    }
  })
}

const getAllCourseCodes = (courseCodes: string[]) => {
  const ayCourseCodes = courseCodes.map(courseCode => `AY${courseCode}`)
  return courseCodes.concat(ayCourseCodes)
}

const isStartDateOutsideInterval = (studyRight: SISStudyRightModel, startDate: Date) => {
  return startDate <= studyRight.startDate && studyRight.startDate <= new Date()
}

const isStartDateInsideAndEndDateOutside = (studyRight: SISStudyRightModel, startDate: Date) => {
  return studyRight.startDate <= startDate && new Date() <= studyRight.endDate
}

const isEndDateBeforeNow = (studyRight: SISStudyRightModel) => studyRight.endDate <= new Date()

const getEmptyCourseInfo = (): CourseInfo => ({
  status: {
    passed: null,
    failed: null,
    unfinished: null,
  },
})

const updatePassedStatus = (courseInfo: CourseInfo, attainmentDate: Date) => {
  if (!courseInfo.status.passed || dayjs(courseInfo.status.passed).isBefore(attainmentDate, 'day')) {
    courseInfo.status.passed = attainmentDate
  }
}

const updateFailedStatus = (courseInfo: CourseInfo, attainmentDate: Date) => {
  if (
    !courseInfo.status.passed &&
    (!courseInfo.status.failed || dayjs(courseInfo.status.failed).isBefore(attainmentDate, 'day'))
  ) {
    courseInfo.status.failed = attainmentDate
  }
}

const updateUnfinishedStatus = (courseInfo: CourseInfo, enrollmentDateTime: Date) => {
  if (
    !courseInfo.status.passed &&
    !courseInfo.status.failed &&
    (!courseInfo.status.unfinished || dayjs(courseInfo.status.unfinished).isBefore(enrollmentDateTime, 'day'))
  ) {
    courseInfo.status.unfinished = enrollmentDateTime
  }
}

export const getCustomOpenUniCourses = async (courseCodes: string[], startDate: Date, endDate: Date) => {
  const allCourseCodes = getAllCourseCodes(courseCodes)
  const allCredits = await getCredits(allCourseCodes, startDate)
  const allEnrollments = await getEnrollments(allCourseCodes, startDate, endDate)
  const courses = await getCourseNames(courseCodes)
  const studentNumbers = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentNumber)) as string[]
  const allStudyRights = await getStudyRights(studentNumbers)
  const studentInfo = await getStudentInfo(studentNumbers)

  const passedGrades = ['1', '2', '3', '4', '5', 'Hyv.', 'hyv.', 'HT', 'TT']
  const failedGrades = ['Hyl.', 'HYL', '0']

  const studentsWithCurrentStudyRight = allStudyRights
    .filter(
      studyRight =>
        isStartDateOutsideInterval(studyRight, startDate) ||
        isStartDateInsideAndEndDateOutside(studyRight, startDate) ||
        isEndDateBeforeNow(studyRight)
    )
    .map(studyRight => studyRight.studentNumber)

  const uniqueStudentsWithCurrentStudyRight = uniq(studentsWithCurrentStudyRight)

  const studentStats: StudentStats = {}

  for (const { studentNumber, email, secondaryEmail } of studentInfo) {
    if (uniqueStudentsWithCurrentStudyRight.includes(studentNumber)) {
      continue
    }
    if (!(studentNumber in studentStats)) {
      studentStats[studentNumber] = {
        courseInfo: courseCodes.reduce((acc, code) => ({ ...acc, [code.replace('AY', '')]: getEmptyCourseInfo() }), {}),
        email,
        secondaryEmail,
        totals: { passed: 0, failed: 0, unfinished: 0 },
      }
    }
    const studentCourses = studentStats[studentNumber].courseInfo
    for (const { attainmentCourseCode, attainmentDate, attainmentStudentNumber, attainmentGrade } of allCredits) {
      if (attainmentStudentNumber === studentNumber) {
        const courseCode = attainmentCourseCode.replace('AY', '')
        if (passedGrades.includes(attainmentGrade)) {
          updatePassedStatus(studentCourses[courseCode], attainmentDate)
        } else if (failedGrades.includes(attainmentGrade)) {
          updateFailedStatus(studentCourses[courseCode], attainmentDate)
        }
      }
    }
    for (const { enrollmentStudentNumber, enrollmentCourseCode, enrollmentDateTime } of allEnrollments) {
      if (enrollmentStudentNumber === studentNumber) {
        const courseCode = enrollmentCourseCode.replace('AY', '')
        updateUnfinishedStatus(studentCourses[courseCode], enrollmentDateTime)
      }
    }
    calculateTotalsForStudent(studentStats, studentNumber)
  }
  const openUniStats = { students: studentStats, courses }
  return openUniStats
}
