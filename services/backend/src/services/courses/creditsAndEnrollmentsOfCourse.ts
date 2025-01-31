import { Op } from 'sequelize'

import { Credit, Student, Semester, Organization, Enrollment, SISStudyRight, SISStudyRightElement } from '../../models'
import { EnrollmentState, Unification } from '../../types'
import { getIsOpen } from './helpers'

export const getCreditsForCourses = async (codes: string[], unification: Unification) => {
  return await Credit.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
      },
      {
        model: Semester,
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
}

export const getStudentNumberToSrElementsMap = async (studentNumbers: string[]) => {
  const studyRights = await SISStudyRight.findAll({
    attributes: ['facultyCode', 'id', 'studentNumber'],
    where: {
      studentNumber: {
        [Op.in]: studentNumbers,
      },
    },
    include: {
      model: Organization,
      attributes: ['name', 'code'],
    },
  })

  const studyRightMap = studyRights.reduce((obj, cur) => {
    obj[cur.id] = cur.toJSON()
    return obj
  }, {})

  const studyRightIds = Object.keys(studyRightMap)

  const studyRightElements = await SISStudyRightElement.findAll({
    attributes: ['code', 'name', 'startDate', 'endDate', 'studyRightId'],
    where: {
      studyRightId: {
        [Op.in]: studyRightIds,
      },
    },
  })

  const studentNumberToSrElementsMap = studyRightElements.reduce((obj, cur) => {
    const studyRight = studyRightMap[cur.studyRightId]
    const { studentNumber } = studyRight
    if (!obj[studentNumber]) {
      obj[studentNumber] = []
    }
    obj[studentNumber].push({ ...cur.toJSON(), studyRight })
    return obj
  }, {})
  return studentNumberToSrElementsMap
}

export const getEnrollmentsForCourses = async (codes: string[], unification: Unification) => {
  return await Enrollment.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
      },
      {
        model: Semester,
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
}
