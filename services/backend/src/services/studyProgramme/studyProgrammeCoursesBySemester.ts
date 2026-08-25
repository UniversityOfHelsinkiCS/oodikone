import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { CreditTypeCode, EnrollmentState } from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { CreditModel, EnrollmentModel } from '../../models'
import { createArrayOfCourses } from '../languageCenterData'
import { getAllProgrammeCourses, getPrimaryCoursesByGroupIds } from '.'

type Attempt = {
  studentNumber: string
  courseCode: string
  completed: boolean
  date: Date
  semestercode: number
  enrolled?: boolean
}

export const getStudyProgrammeStatsForColorizedCoursesTable = async (studyProgramme: string) => {
  const courses = await getAllProgrammeCourses(mapToProviders([studyProgramme])[0])
  const autumnSemester2017 = 135
  const courseIds = courses.map(course => course.id)
  const idToGroupId = new Map(courses.map(course => [course.id, course.groupId]))

  const primaryCourses = await getPrimaryCoursesByGroupIds([...new Set(courses.map(course => course.groupId))])
  const groupIdToPrimaryCode = new Map(primaryCourses.map(course => [course.groupId, course.code]))

  const courseCodeOf = (courseId: string) => {
    const groupId = idToGroupId.get(courseId)
    return groupId ? groupIdToPrimaryCode.get(groupId) : undefined
  }

  const credits = await CreditModel.findAll({
    attributes: ['course_id', 'student_studentnumber', 'semestercode', 'attainment_date'],
    where: {
      course_id: { [Op.in]: courseIds },
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: CreditTypeCode.PASSED,
    },
    raw: true,
  })

  const enrollments = await EnrollmentModel.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_id', 'enrollment_date_time', 'state'],
    where: {
      course_id: { [Op.in]: courseIds },
      semestercode: { [Op.gte]: autumnSemester2017 }, // It is ok to use enrollments before OK sisu-migration, ColorizedTableData doesn't need it
      state: { [Op.in]: [EnrollmentState.ENROLLED, EnrollmentState.REJECTED] },
    },
    raw: true,
  })

  const studentList = new Set<string>()
  const attemptsByStudents = {} as Record<string, Attempt[]>

  credits.forEach(credit => {
    const courseCode = courseCodeOf(credit.course_id)
    if (!courseCode) return
    const studentNumber = credit.student_studentnumber
    studentList.add(studentNumber)
    attemptsByStudents[studentNumber] ??= []
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode,
      completed: true,
      date: credit.attainment_date,
      semestercode: credit.semestercode,
    })
  })

  enrollments.forEach(enrollment => {
    const courseCode = courseCodeOf(enrollment.course_id)
    if (!courseCode) return
    const studentNumber = enrollment.studentnumber
    attemptsByStudents[studentNumber] ??= []
    studentList.add(studentNumber)
    if (
      attemptsByStudents[studentNumber].find(
        attempt =>
          !attempt.completed && attempt.semestercode === enrollment.semestercode && attempt.courseCode === courseCode
      )
    ) {
      return
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode,
      completed: false,
      date: enrollment.enrollment_date_time,
      semestercode: enrollment.semestercode,
      enrolled: enrollment.state === EnrollmentState.ENROLLED,
    })
  })

  const attemptsArray = [] as Attempt[]
  studentList.forEach(studentNumber => attemptsArray.push(...attemptsByStudents[studentNumber]))

  const unorderedTableData = createArrayOfCourses(attemptsArray, primaryCourses)
  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData }
}
