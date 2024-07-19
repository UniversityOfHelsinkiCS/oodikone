import { Includeable, Op, col, fn } from 'sequelize'

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
import { CreditTypeCode, ElementDetailType, EnrollmentType, Name } from '../../types'
import { getCurrentSemester } from '../semesters'
import { formatStudyright } from './format'
import { whereStudents, sinceDate } from '.'

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
          [Op.in]: studyRights.map(studyRight => studyRight.toJSON<SISStudyRight>().id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON<SISStudyRight>())
}

export const getStudyTracksForProgramme = async (studyProgramme: string) =>
  (
    await SISStudyRightElement.findAll({
      attributes: [[fn('DISTINCT', col('study_track')), 'studyTrack']],
      where: {
        code: studyProgramme,
        studyTrack: { [Op.not]: null },
      },
    })
  )
    .map(studyTrack => studyTrack.toJSON().studyTrack)
    .reduce<Record<string, Name | 'All students of the programme'>>(
      (acc, track) => {
        acc[track.code] = track.name
        return acc
      },
      { [studyProgramme]: 'All students of the programme' }
    )

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
