import moment from 'moment'
import { literal, Op } from 'sequelize'

import { Course, Credit, Enrollment, Student, Studyplan, SISStudyRight, SISStudyRightElement } from '../../models'
import { Tag, TagStudent } from '../../models/kone'
import { EnrollmentState } from '../../types'

const getStudentTags = async (studyRights: string[], studentNumbers: string[]) => {
  return await TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: [
      {
        model: Tag,
        attributes: ['tag_id', 'tagname', 'personal_user_id'],
        where: {
          studytrack: {
            [Op.in]: studyRights,
          },
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
}

const getCreditsOfStudent = async (
  studentNumbers: string[],
  studyRights: string[],
  attainmentDateFrom: string | moment.Moment,
  endDate: Date
) => {
  const studyPlans = await Studyplan.findAll({
    where: { studentnumber: studentNumbers },
    attributes: ['included_courses'],
    raw: true,
  })
  const studyPlanCourses = Array.from(new Set([...studyPlans.map(plan => plan.included_courses)].flat()))

  const creditsOfStudent = {
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        // takes into account possible progress tests taken earlier than the start date
        course_code: ['320001', 'MH30_001'].includes(studyRights[0])
          ? ['375063', '339101', ...studyPlanCourses]
          : studyPlanCourses,
      },
    ],
    student_studentnumber: {
      [Op.in]: studentNumbers,
    },
  }
  return creditsOfStudent
}

const getCourses = async (creditsOfStudent: any) => {
  return await Course.findAll({
    attributes: [literal('DISTINCT ON("code") code') as unknown as string, 'name'],
    include: [
      {
        model: Credit,
        attributes: [],
        where: creditsOfStudent,
      },
    ],
    raw: true,
  })
}

const getEnrollments = async (studentNumbers: string[], attainmentDateFrom: moment.Moment | string, endDate: Date) => {
  return await Enrollment.findAll({
    attributes: ['course_code', 'state', 'enrollment_date_time', 'studentnumber', 'semestercode', 'studyright_id'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: EnrollmentState.ENROLLED,
      enrollment_date_time: {
        [Op.between]: [attainmentDateFrom, endDate],
      },
    },
    raw: true,
  })
}

const getStudents = async (studentNumbers: string[]) => {
  const students: Array<Student & { tags?: TagStudent[] }> = await Student.findAll({
    attributes: [
      'firstnames',
      'lastname',
      'studentnumber',
      'citizenships',
      'dateofuniversityenrollment',
      'creditcount',
      'abbreviatedname',
      'email',
      'secondary_email',
      'phone_number',
      'updatedAt',
      'gender_code',
      'birthdate',
      'sis_person_id',
    ],
    include: [
      {
        model: SISStudyRight,
        attributes: [
          'id',
          'extentCode',
          'facultyCode',
          'admissionType',
          'cancelled',
          'semesterEnrollments',
          'startDate',
        ],
        separate: true,
        include: [
          {
            model: SISStudyRightElement,
            required: true,
            attributes: [
              'code',
              'name',
              'studyTrack',
              'graduated',
              'startDate',
              'endDate',
              'phase',
              'degreeProgrammeType',
            ],
          },
        ],
      },
      {
        model: Studyplan,
        attributes: [
          'included_courses',
          'programme_code',
          'includedModules',
          'completed_credits',
          'curriculum_period_id',
          'sis_study_right_id',
        ],
        separate: true,
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
  return students
}

const getCredits = async (creditsOfStudent: any) => {
  return await Credit.findAll({
    attributes: [
      'grade',
      'credits',
      'credittypecode',
      'attainment_date',
      'isStudyModule',
      'student_studentnumber',
      'course_code',
      'language',
      'studyright_id',
    ],
    where: creditsOfStudent,
    raw: true,
  })
}

type StudentsIncludeCoursesBetween = {
  students: Awaited<ReturnType<typeof getStudents>>
  enrollments: Awaited<ReturnType<typeof getEnrollments>>
  credits: Awaited<ReturnType<typeof getCredits>>
  courses: Awaited<ReturnType<typeof getCourses>>
}

export const getStudentsIncludeCoursesBetween = async (
  studentNumbers: string[],
  startDate: string,
  endDate: Date,
  studyRights: string[],
  tag?: Tag
) => {
  const studentTags = await getStudentTags(studyRights, studentNumbers)

  const { studentNumbersWithTag, studentNumberToTags } = studentTags.reduce(
    (acc, studentTag) => {
      acc.studentNumberToTags[studentTag.studentnumber] = acc.studentNumberToTags[studentTag.studentnumber] || []
      acc.studentNumberToTags[studentTag.studentnumber].push(studentTag)
      if (tag && studentTag.tag_id === tag.tag_id) {
        acc.studentNumbersWithTag.push(studentTag.studentnumber)
      }
      return acc
    },
    { studentNumbersWithTag: [] as string[], studentNumberToTags: {} as Record<string, TagStudent[]> }
  )

  if (tag) {
    studentNumbers = studentNumbersWithTag
  }

  if (studentNumbers.length === 0) {
    return { students: [], enrollments: [], credits: [], courses: [] } as StudentsIncludeCoursesBetween
  }

  const attainmentDateFrom = tag && tag.year !== null ? moment(startDate).year(Number(tag.year)) : startDate

  const creditsOfStudent = await getCreditsOfStudent(studentNumbers, studyRights, attainmentDateFrom, endDate)

  const [courses, enrollments, students, credits] = await Promise.all([
    getCourses(creditsOfStudent),
    getEnrollments(studentNumbers, attainmentDateFrom, endDate),
    getStudents(studentNumbers),
    getCredits(creditsOfStudent),
  ])

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  return { students, enrollments, credits, courses } as StudentsIncludeCoursesBetween
}
