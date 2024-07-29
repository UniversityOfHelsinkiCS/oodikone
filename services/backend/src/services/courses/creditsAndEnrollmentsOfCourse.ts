/* eslint-disable @typescript-eslint/naming-convention */
import { Op } from 'sequelize'

import { Credit, Student, Semester, Organization, Enrollment, SISStudyRight, SISStudyRightElement } from '../../models'
import { Unification } from './unification'

const getIsOpen = (unification: Unification) => {
  const options: Record<Unification, boolean | object> = {
    open: true,
    regular: false,
    unify: { [Op.in]: [false, true] },
  }
  return options[unification]
}

export const creditsForCourses = async (codes: string[], unification: Unification) => {
  const is_open = getIsOpen(unification)

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
      student_studentnumber: {
        [Op.ne]: null,
      },
      [Op.or]: [{ is_open }, { is_open: null }],
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
    attributes: ['code', 'name', 'startDate', 'studyRightId'],
    where: {
      studyRightId: {
        [Op.in]: studyRightIds,
      },
    },
  })

  return studyRightElements.reduce((obj, cur) => {
    const studyRight = studyRightMap[cur.studyRightId]
    const { studentNumber } = studyRight
    if (!obj[studentNumber]) {
      obj[studentNumber] = []
    }
    obj[studentNumber].push({ ...cur.toJSON(), studyRight })
    return obj
  }, {})
}

export const enrollmentsForCourses = async (codes: string[], unification: Unification) => {
  const is_open = getIsOpen(unification)

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
      studentnumber: {
        [Op.ne]: null,
      },
      enrollment_date_time: { [Op.gte]: new Date('2021-05-31') },
      state: ['ENROLLED', 'CONFIRMED'],
      [Op.or]: [{ is_open }, { is_open: null }],
    },
  })
}
