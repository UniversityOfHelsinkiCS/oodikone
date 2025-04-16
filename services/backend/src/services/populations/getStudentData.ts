import { literal, Op, type WhereOptions } from 'sequelize'

import { serviceProvider } from '../../config'
import { Course, Credit, Enrollment, Student, Studyplan, SISStudyRight, SISStudyRightElement } from '../../models'
import { EnrollmentState } from '../../types'

const creditFilterBuilder = async (
  studentNumbers: string[],
  studyRights: string[],
  attainmentDateFrom: string,
  endDate: Date
): Promise<WhereOptions> => {
  const includedCoursesInStudyPlans: Array<Pick<Studyplan, 'included_courses'>> = await Studyplan.findAll({
    attributes: ['included_courses'],
    where: {
      studentnumber: { [Op.in]: studentNumbers },
    },
    raw: true,
  })

  const uniqueCourses = new Set(includedCoursesInStudyPlans.flatMap(plan => plan.included_courses))

  // takes into account possible progress tests taken earlier than the start date
  const courseCodes =
    ['320001', 'MH30_001'].includes(studyRights[0]) && serviceProvider !== 'fd'
      ? [...uniqueCourses, '375063', '339101']
      : [...uniqueCourses]

  return {
    student_studentnumber: { [Op.in]: studentNumbers },
    [Op.or]: [{ attainment_date: { [Op.between]: [attainmentDateFrom, endDate] } }, { course_code: courseCodes }],
  }
}

export type StudentCourse = Pick<Course, 'code' | 'name'>
const getCourses = (creditFilter: WhereOptions): Promise<Array<StudentCourse>> =>
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

export type StudentEnrollment = Pick<
  Enrollment,
  'course_code' | 'state' | 'enrollment_date_time' | 'studentnumber' | 'semestercode' | 'studyright_id'
>
const getEnrollments = (
  studentNumbers: string[],
  startDate: string,
  endDate: Date
): Promise<Array<StudentEnrollment>> =>
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

type StudentPersonalData = Pick<
  Student,
  | 'firstnames'
  | 'lastname'
  | 'studentnumber'
  | 'citizenships'
  | 'dateofuniversityenrollment'
  | 'creditcount'
  | 'abbreviatedname'
  | 'email'
  | 'secondary_email'
  | 'phone_number'
  | 'updatedAt'
  | 'gender_code'
  | 'birthdate'
  | 'sis_person_id'
>

type StudentStudyRightElement = Pick<
  SISStudyRightElement,
  'code' | 'name' | 'studyTrack' | 'graduated' | 'startDate' | 'endDate' | 'phase' | 'degreeProgrammeType'
>

type StudentStudyRight = Pick<
  SISStudyRight,
  'id' | 'extentCode' | 'facultyCode' | 'admissionType' | 'cancelled' | 'semesterEnrollments' | 'startDate'
> & {
  studyRightElements: Array<StudentStudyRightElement>
}

export type StudentStudyPlan = Pick<
  Studyplan,
  | 'included_courses'
  | 'programme_code'
  | 'includedModules'
  | 'completed_credits'
  | 'curriculum_period_id'
  | 'sis_study_right_id'
>

export type StudentData = StudentPersonalData & {
  studyplans: Array<StudentStudyPlan>
  studyRights: Array<StudentStudyRight>
}

const getStudents = (studentNumbers: string[]): Promise<Array<StudentData>> =>
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
  }).then(data => data.map(x => x.get({ plain: true })))

export type StudentCredit = Pick<
  Credit,
  | 'grade'
  | 'credits'
  | 'credittypecode'
  | 'attainment_date'
  | 'isStudyModule'
  | 'student_studentnumber'
  | 'course_code'
  | 'language'
  | 'studyright_id'
>
const getCredits = (creditFilter: WhereOptions): Promise<Array<StudentCredit>> =>
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
  courses: StudentCourse[]
  enrollments: StudentEnrollment[]
  credits: StudentCredit[]
  students: Array<StudentData>
}

export const getStudentsIncludeCoursesBetween = async (
  studentNumbers: string[],
  startDate: string,
  endDate: Date,
  studyRights: string[]
): Promise<StudentsIncludeCoursesBetween> => {
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
    students,
  }
}
