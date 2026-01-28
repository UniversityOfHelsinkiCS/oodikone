import { getAllProgrammeCourses } from "."
import { Op } from 'sequelize'
import { CreditModel, EnrollmentModel } from '../../models'
import { createArrayOfCourses } from '../languageCenterData'
import { CreditTypeCode, EnrollmentState } from '@oodikone/shared/types'
import { mapToProviders } from "@oodikone/shared/util"
import { orderBy } from "lodash-es"

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
  const courseCodes = courses.map(course => course.code)

  const credits = await CreditModel.findAll({
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'attainment_date'],
    where: {
      course_code: { [Op.in]: courseCodes },
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: CreditTypeCode.PASSED,
    },
    raw: true,
  })

  const enrollments = await EnrollmentModel.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'state'],
    where: {
      course_code: { [Op.in]: courseCodes },
      semestercode: { [Op.gte]: autumnSemester2017 },
      state: { [Op.in]: [EnrollmentState.ENROLLED, EnrollmentState.REJECTED] },
    },
    raw: true,
  })

  const studentList = new Set<string>()
  const attemptsByStudents = {} as Record<string, Attempt[]>

  credits.forEach(credit => {
    const studentNumber = credit.student_studentnumber
    studentList.add(studentNumber)
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: credit.course_code,
      completed: true,
      date: credit.attainment_date,
      semestercode: credit.semestercode,
    })
  })

  enrollments.forEach(enrollment => {
    const studentNumber = enrollment.studentnumber
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    studentList.add(studentNumber)
    if (
      attemptsByStudents[studentNumber].find(
        attempt =>
          !attempt.completed &&
          attempt.semestercode === enrollment.semestercode &&
          attempt.courseCode === enrollment.course_code
      )
    ) {
      return
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: enrollment.course_code,
      completed: false,
      date: enrollment.enrollment_date_time,
      semestercode: enrollment.semestercode,
      enrolled: enrollment.state === EnrollmentState.ENROLLED,
    })
  })

  const attemptsArray = [] as Attempt[]
  studentList.forEach(studentNumber => attemptsArray.push(...attemptsByStudents[studentNumber]))

  const unorderedTableData = await createArrayOfCourses(attemptsArray, courses)
  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData }
}

