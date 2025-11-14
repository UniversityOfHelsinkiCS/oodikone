import { Op } from 'sequelize'

import { Credit, Enrollment, SISStudyRight, SISStudyRightElement, Student, Studyplan } from '@oodikone/shared/models'
import { Tag, TagStudent } from '@oodikone/shared/models/kone'
import { EnrollmentState } from '@oodikone/shared/types'
import {
  CreditModel,
  EnrollmentModel,
  StudentModel,
  StudyplanModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../../models'
import { TagModel, TagStudentModel } from '../../models/kone'

export type StudentTags = TagStudent & {
  tag: Pick<Tag, 'tag_id' | 'tagname' | 'personal_user_id'>
}

export const getStudentTagMap = async (studyRights: string[], studentNumbers: string[], userId: string) => {
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

  const studentTagMap = new Map<string, StudentTags[]>()
  for (const studentTag of studentTags) {
    const data = studentTagMap.get(studentTag.studentnumber) ?? []

    data.push(studentTag)
    studentTagMap.set(studentTag.studentnumber, data)
  }

  return studentTagMap
}

export type StudentEnrollment = Pick<
  Enrollment,
  'course_code' | 'state' | 'enrollment_date_time' | 'semestercode' | 'studentnumber'
>
export const getEnrollments = (studentNumbers: string[], startDate: string): Promise<Array<StudentEnrollment>> =>
  EnrollmentModel.findAll({
    attributes: ['course_code', 'state', 'enrollment_date_time', 'semestercode', 'studentnumber'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: EnrollmentState.ENROLLED,
      enrollment_date_time: {
        [Op.gte]: startDate,
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

export type StudentStudyRight = Pick<
  SISStudyRight,
  'id' | 'extentCode' | 'facultyCode' | 'admissionType' | 'cancelled' | 'semesterEnrollments' | 'startDate' | 'tvex'
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

export const getCredits = async (studentNumbers: string[]): Promise<Array<StudentCredit>> =>
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
    where: {
      student_studentnumber: { [Op.in]: studentNumbers },
    },
    raw: true,
  })

export const getStudyRightElementsForStudyRight = async (studentNumbers: string[], code: string) =>
  SISStudyRightElementModel.findAll({
    attributes: [],
    where: { code },
    include: {
      model: SISStudyRightModel,
      attributes: ['studentNumber'],
      where: {
        studentNumber: { [Op.in]: studentNumbers },
      },
      include: [
        {
          model: SISStudyRightElementModel,
          attributes: ['code', 'name', 'degreeProgrammeType', 'startDate', 'endDate'],
        },
      ],
    },
  })
