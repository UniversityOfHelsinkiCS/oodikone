import { literal, Op, WhereOptions } from 'sequelize'

import { Course, Credit, Enrollment, Student, Studyplan, SISStudyRight, SISStudyRightElement } from '../../models'
import { Tag, TagStudent } from '../../models/kone'
import { EnrollmentState } from '../../types'

const getStudentTags = (studyRights: string[], studentNumbers: string[]): Promise<TagStudent[]> =>
  TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname', 'personal_user_id'],
      where: {
        studytrack: { [Op.in]: studyRights },
      },
    },
    where: {
      studentnumber: { [Op.in]: studentNumbers },
    },
  })

const queryStudyplanCourses = (studentNumbers: string[]) =>
  Studyplan.findAll({
    where: {
      studentnumber: { [Op.in]: studentNumbers },
    },
    attributes: ['included_courses'],
    raw: true,
  })

const creditFilterBuilder = async (
  studentNumbers: string[],
  studyRights: string[],
  attainmentDateFrom: string,
  endDate: Date
): Promise<WhereOptions> => {
  const studyPlans = await queryStudyplanCourses(studentNumbers)

  const studyPlanCourses = new Set(studyPlans.flatMap(plan => plan.included_courses))
  // takes into account possible progress tests taken earlier than the start date
  const courseCodes = ['320001', 'MH30_001'].includes(studyRights[0])
    ? [...studyPlanCourses, '375063', '339101']
    : [...studyPlanCourses]

  return {
    student_studentnumber: { [Op.in]: studentNumbers },
    [Op.or]: [{ attainment_date: { [Op.between]: [attainmentDateFrom, endDate] } }, { course_code: courseCodes }],
  }
}

const getCourses = (creditFilter: WhereOptions) =>
  Course.findAll({
    attributes: [[literal('DISTINCT ON("code") code'), 'code'], 'name'],
    include: [
      {
        model: Credit,
        attributes: [],
        where: creditFilter,
      },
    ],
    raw: true,
  })

const getEnrollments = (studentNumbers: string[], startDate: string, endDate: Date) =>
  Enrollment.findAll({
    attributes: ['course_code', 'state', 'enrollment_date_time', 'studentnumber', 'semestercode', 'studyright_id'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: EnrollmentState.ENROLLED,
      enrollment_date_time: {
        [Op.between]: [startDate, endDate],
      },
    },
    raw: true,
  })

const getStudents = (studentNumbers: string[]): Promise<Array<Student>> =>
  Student.findAll({
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

const getCredits = (creditFilter: WhereOptions) =>
  Credit.findAll({
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
    where: creditFilter,
    raw: true,
  })

type StudentsIncludeCoursesBetween = {
  courses: Course[]
  enrollments: Enrollment[]
  credits: Credit[]
  students: Array<Student & { tags: TagStudent[] }>
}

export const getStudentsIncludeCoursesBetween = async (
  studentNumbers: string[],
  startDate: string,
  endDate: Date,
  studyRights: string[]
): Promise<StudentsIncludeCoursesBetween> => {
  const studentTags = await getStudentTags(studyRights, studentNumbers)
  const studentNumberToTags = studentTags.reduce((acc: Record<string, TagStudent[]>, studentTag) => {
    const { studentnumber } = studentTag
    acc[studentnumber] = [...(acc[studentnumber] || []), studentTag]
    return acc
  }, {})

  const creditsFilter = await creditFilterBuilder(studentNumbers, studyRights, startDate, endDate)
  const [courses, enrollments, credits, students] = await Promise.all([
    getCourses(creditsFilter),
    getEnrollments(studentNumbers, startDate, endDate),
    getCredits(creditsFilter),
    getStudents(studentNumbers),
  ])

  return {
    courses,
    enrollments,
    credits,
    students: (students as Array<Student & { tags: TagStudent[] }>).map(student => {
      student.tags = studentNumberToTags[student.studentnumber] || []
      return student
    }),
  }
}
