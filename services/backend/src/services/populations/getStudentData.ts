import { Op, type WhereOptions } from 'sequelize'

import { EnrollmentState } from '@oodikone/shared/types'
import { serviceProvider } from '../../config'
import {
  CreditModel,
  EnrollmentModel,
  StudentModel,
  StudyplanModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../../models'
import { TagModel, TagStudentModel } from '../../models/kone'

type StudentTags = TagStudentModel & {
  tag: Pick<TagModel, 'tag_id' | 'tagname' | 'personal_user_id'>
}

export type TaggetStudentData = StudentData & {
  tags: StudentTags[]
}

export const getStudentTags = async (studyRights: string[], studentNumbers: string[], userId: string) => {
  const studentTags = await TagStudentModel.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: {
      model: TagModel,
      attributes: ['tag_id', 'tagname', 'personal_user_id'],
      where: {
        studytrack: { [Op.in]: studyRights },
        personal_user_id: { [Op.or]: [userId, null] },
      },
    },
    where: {
      studentnumber: { [Op.in]: studentNumbers },
    },
  })

  const studentTagList: Record<string, TagStudentModel[]> = Object.fromEntries(studentNumbers.map(n => [n, []]))
  studentTags.forEach(studentTag => studentTagList[studentTag.studentnumber].push(studentTag))

  return studentTagList
}

export const creditFilterBuilder = async (
  studentNumbers: string[],
  studyRights: string[],
  attainmentDateFrom: string,
  endDate: Date
): Promise<WhereOptions> => {
  const includedCoursesInStudyPlans: Array<Pick<StudyplanModel, 'included_courses'>> = await StudyplanModel.findAll({
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

export type StudentEnrollment = Pick<
  EnrollmentModel,
  'course_code' | 'state' | 'enrollment_date_time' | 'studentnumber' | 'semestercode' | 'studyright_id'
>
export const getEnrollments = (
  studentNumbers: string[],
  startDate: string,
  endDate: Date
): Promise<Array<StudentEnrollment>> =>
  EnrollmentModel.findAll({
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
  StudentModel,
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
  SISStudyRightElementModel,
  'code' | 'name' | 'studyTrack' | 'graduated' | 'startDate' | 'endDate' | 'phase' | 'degreeProgrammeType'
>

type StudentStudyRight = Pick<
  SISStudyRightModel,
  'id' | 'extentCode' | 'facultyCode' | 'admissionType' | 'cancelled' | 'semesterEnrollments' | 'startDate' | 'tvex'
> & {
  studyRightElements: Array<StudentStudyRightElement>
}

export type StudentStudyPlan = Pick<
  StudyplanModel,
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

export const getStudents = (studentNumbers: string[]): Promise<Array<StudentData>> =>
  StudentModel.findAll({
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
        model: SISStudyRightModel,
        attributes: [
          'id',
          'extentCode',
          'facultyCode',
          'admissionType',
          'cancelled',
          'semesterEnrollments',
          'startDate',
          'tvex',
        ],
        separate: true,
        include: [
          {
            model: SISStudyRightElementModel,
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
        model: StudyplanModel,
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
  CreditModel,
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
export const getCredits = (creditFilter: WhereOptions): Promise<Array<StudentCredit>> =>
  CreditModel.findAll({
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
