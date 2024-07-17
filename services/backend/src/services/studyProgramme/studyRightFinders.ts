import { Includeable, Op } from 'sequelize'

import { dbConnections } from '../../database/connection'
import {
  ElementDetail,
  SemesterEnrollment,
  Studyright,
  Student,
  StudyrightElement,
  SISStudyRight,
  SISStudyRightElement,
  Credit,
} from '../../models'
import { CreditTypeCode, ElementDetailType, EnrollmentType } from '../../types'
import { getCurrentSemester } from '../semesters'
import { formatStudyright } from './format'
import { whereStudents, sinceDate } from '.'

const { sequelize } = dbConnections

export const getStudyRightsInProgramme = async (
  programmeCode: string,
  onlyGraduated: boolean,
  includeStudentsAndCredits = false
) => {
  const where: Record<string, any> = { code: programmeCode }
  if (onlyGraduated) {
    where.graduated = true
  }

  const studyRights = await SISStudyRight.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: [],
      where,
    },
    where: {
      studentNumber: {
        [Op.not]: null,
      },
    },
  })

  const include: Includeable[] = [
    {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: ['phase', 'code', 'name', 'startDate', 'endDate', 'graduated', 'studyTrack'],
    },
  ]

  if (includeStudentsAndCredits) {
    include.push({
      model: Student,
      attributes: ['gender_code', 'home_country_en'],
      include: [
        {
          model: Credit,
          attributes: ['attainment_date', 'credits'],
          where: {
            isStudyModule: false,
            credittypecode: {
              [Op.in]: [CreditTypeCode.PASSED, CreditTypeCode.APPROVED],
            },
          },
          required: false,
        },
      ],
    })
  }

  return (
    await SISStudyRight.findAll({
      attributes: ['id', 'extentCode', 'semesterEnrollments', 'studentNumber'],
      include,
      where: {
        id: {
          [Op.in]: studyRights.map(studyRight => studyRight.toJSON().id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())
}

export const graduatedStudyRightsByStartDate = async (
  studytrack: string,
  startDate: Date,
  endDate: Date,
  combined: boolean
) => {
  const query: Record<string, any> = {
    include: [
      {
        model: StudyrightElement,
        required: true,
        include: {
          model: ElementDetail,
          where: {
            code: studytrack,
          },
        },
      },
      {
        model: Student,
        attributes: ['studentnumber'],
        required: true,
      },
    ],
    where: {
      graduated: 1,
      student_studentnumber: {
        [Op.not]: null,
      },
    },
  }
  if (!combined) {
    // This logic is based on function studentnumbersWithAllStudyrightElements from ./populations.js as the goal is to find the students
    // who have started their studies in the programme between startDate and endDate (i.e. the same logic as in class statistics)
    query.where[Op.and] = [
      sequelize.where(
        sequelize.fn('GREATEST', sequelize.col('studyright_elements.startdate'), sequelize.col('studyright.startdate')),
        { [Op.between]: [startDate, endDate] }
      ),
    ]
  } else {
    query.where.startdate = { [Op.between]: [startDate, endDate] }
  }
  return (await Studyright.findAll(query)).map(formatStudyright)
}

export const graduatedStudyRights = async (studytrack: string, since: Date, studentnumbers: string[]) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: [
            {
              model: ElementDetail,
              required: true,
              where: {
                code: studytrack,
              },
            },
          ],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        graduated: 1,
        enddate: sinceDate(since),
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

export const inactiveStudyrights = async (studytrack: string, studentnumbers: string[]) => {
  const currentSemester = await getCurrentSemester()
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        required: true,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid', 'enddate'],
        where: {
          graduated: 0,
          active: 0,
        },
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode', 'enrollmenttype'],
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students.filter(
    student =>
      student.studyrights[0].enddate <= new Date() ||
      !student.semester_enrollments.find(enrollment => enrollment.semestercode === currentSemester.semestercode) ||
      student.semester_enrollments.find(enrollment => enrollment.semestercode === currentSemester.semestercode)
        ?.enrollmenttype === EnrollmentType.INACTIVE
  )
}

export const getStudyRights = async students =>
  (
    await Studyright.findAll({
      attributes: [
        'studyrightid',
        'startdate',
        'studystartdate',
        'enddate',
        'graduated',
        'prioritycode',
        'extentcode',
        'cancelled',
        'facultyCode',
        'actual_studyrightid',
        'semesterEnrollments',
      ],
      where: {
        student_studentnumber: students,
      },
      include: [
        {
          model: StudyrightElement,
          include: [
            {
              model: ElementDetail,
              where: {
                type: ElementDetailType.PROGRAMME,
              },
            },
          ],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)
