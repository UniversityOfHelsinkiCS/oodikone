import { Op } from 'sequelize'

import { EnrollmentState, Unification } from '@oodikone/shared/types'
import {
  CreditModel,
  SemesterModel,
  OrganizationModel,
  EnrollmentModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../../models'
import { getIsOpen } from './helpers'

export const getCreditsForCourses = async (codes: string[], unification: Unification) =>
  CreditModel.findAll({
    attributes: ['grade', 'course_code', 'credits', 'attainment_date', 'student_studentnumber', 'studyright_id'],
    include: [
      {
        model: SemesterModel,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: new Date(),
          },
        },
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      is_open: getIsOpen(unification),
    },
    order: [['attainment_date', 'ASC']],
  })

export const getStudentNumberToSrElementsMap = async (studentNumbers: string[]) => {
  const studyRights = await SISStudyRightModel.findAll({
    attributes: ['facultyCode', 'id', 'studentNumber'],
    where: {
      studentNumber: {
        [Op.in]: studentNumbers,
      },
    },
    include: {
      model: OrganizationModel,
      attributes: ['name', 'code'],
    },
  })

  const studyRightIds = studyRights.map(({ id }) => id)
  const studyRightMap = new Map<
    string,
    {
      studentNumber: string
      facultyCode: string
      organization: Pick<OrganizationModel, 'name' | 'code'>
    }
  >(studyRights.map(sr => [sr.id, sr.toJSON()]))

  const studyRightElements = await SISStudyRightElementModel.findAll({
    attributes: ['code', 'name', 'startDate', 'endDate', 'studyRightId'],
    where: {
      studyRightId: { [Op.in]: studyRightIds },
    },
    raw: true,
  })

  return studyRightElements.reduce((obj, cur) => {
    const { studentNumber, ...studyRight } = studyRightMap.get(cur.studyRightId)!
    obj[studentNumber] ??= []
    obj[studentNumber].push({ ...cur, studyRight })

    return obj
  }, {})
}

export const getEnrollmentsForCourses = async (codes: string[], unification: Unification) =>
  EnrollmentModel.findAll({
    attributes: ['studentnumber', 'enrollment_date_time', 'course_code'],
    include: [
      {
        model: SemesterModel,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: new Date(),
          },
        },
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      enrollment_date_time: { [Op.gte]: new Date('2021-05-31') },
      state: EnrollmentState.ENROLLED,
      is_open: getIsOpen(unification),
    },
  })
