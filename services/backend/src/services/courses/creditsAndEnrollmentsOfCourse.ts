import { Op } from 'sequelize'

import { Credit } from '@oodikone/shared/models'
import { EnrollmentState, Unification } from '@oodikone/shared/types'
import {
  StudentModel,
  CreditModel,
  SemesterModel,
  OrganizationModel,
  EnrollmentModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../../models'
import { getIsOpen } from './helpers'

export const getCreditsForCourses = async (codeGroups: string[][], unification: Unification) => {
  const allCourseCodes = codeGroups.flatMap(group => group)

  // We need the credits grouped by student numbers so that we can check if a student has
  // completed a substitution group
  const students = await StudentModel.findAll({
    raw: true,
    nest: true,
    attributes: ['studentnumber'],
    include: [
      {
        model: CreditModel,
        attributes: [
          'grade',
          'course_code',
          'credits',
          'attainment_date',
          'student_studentnumber',
          'studyright_id',
          'credittypecode',
        ],
        where: {
          course_code: {
            [Op.in]: allCourseCodes,
          },
          is_open: getIsOpen(unification),
        },
        order: [['attainment_date', 'ASC']],
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
      },
    ],
  })

  const studentNumberToCredits = students.reduce<Record<string, Credit[]>>((acc, student) => {
    acc[student.studentnumber] ??= []
    acc[student.studentnumber] = acc[student.studentnumber].concat(student.credits)

    return acc
  }, {})

  const completedGroups: Credit[][] = []
  for (const studentCredits of Object.values(studentNumberToCredits)) {
    const codesOfPassedCredits = studentCredits.map(credit => CreditModel.passed(credit) && credit.course_code)
    for (const group of codeGroups) {
      if (group.length === 1) {
        // Failed courses are only calculated for the original course and 1-to-1 substitutions
        const credits = studentCredits.filter(credit => credit.course_code === group.at(0))
        if (credits.length) {
          completedGroups.push(credits)
        }
      }
      // For substitution groups we must only get passed groups
      else if (group.every(code => codesOfPassedCredits.includes(code))) {
        // The credit in question should always exist because we just checked that it does
        completedGroups.push(
          group.map(code => studentCredits.find(credit => credit.course_code === code && CreditModel.passed(credit))!)
        )
      } else {
        // "Partially completed substitution, do not count towards anything"
      }
    }
  }

  return completedGroups
}

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

export const getEnrollmentsForCourses = async (codeGroup: string[][], unification: Unification) =>
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
      // Include only enrollments from the original course and 1-to-1 substitutions
      course_code: {
        [Op.in]: codeGroup.filter(group => group.length === 1).flatMap(group => group),
      },
      enrollment_date_time: { [Op.gte]: new Date('2021-05-31') },
      state: EnrollmentState.ENROLLED,
      is_open: getIsOpen(unification),
    },
  })
