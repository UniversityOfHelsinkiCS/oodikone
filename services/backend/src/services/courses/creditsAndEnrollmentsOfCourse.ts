import { Op } from 'sequelize'

import { Credit, Enrollment } from '@oodikone/shared/models'
import { EnrollmentState, Unification } from '@oodikone/shared/types'
import { enrollmentTimeDateThreshold } from '@oodikone/shared/util'
import {
  CreditModel,
  SemesterModel,
  OrganizationModel,
  EnrollmentModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
  CourseModel,
} from '../../models'
import { now } from '../../util/clock'
import { getIsOpen } from './helpers'

export const getCreditsForCourses = async (
  groupIdGroups: string[][],
  allCourseIds: string[],
  unification: Unification,
  from: Date,
  to: Date
) => {
  // We need the credits grouped by student numbers so that we can check if a student has
  // completed a substitution group
  const attainments = await CreditModel.findAll({
    raw: true,
    nest: true,
    attributes: [
      'grade',
      'course_code',
      'course_id',
      'credits',
      'attainment_date',
      'student_studentnumber',
      'studyright_id',
      'credittypecode',
    ],
    where: {
      course_id: {
        [Op.in]: allCourseIds,
      },
      is_open: getIsOpen(unification),
      credittypecode: { [Op.not]: CreditTypeCode.IMPROVED }, // We do not care about improved grades
      attainment_date: { [Op.between]: [from, to] },
    },
    order: [['attainment_date', 'ASC']],
    include: [
      {
        model: SemesterModel,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: now(),
          },
        },
      },
      {
        model: CourseModel,
        attributes: ['groupId'],
        required: true,
      },
    ],
  })

  const studentNumberToCredits = attainments.reduce<Record<string, Credit[]>>((acc, att) => {
    acc[att.student_studentnumber] ??= []
    acc[att.student_studentnumber].push(att)
    return acc
  }, {})

  const completedGroups: Credit[][] = []
  for (const studentCredits of Object.values(studentNumberToCredits)) {
    const groupIdsOfPassedCredits = studentCredits
      .filter(credit => CreditModel.passed(credit))
      .map(credit => credit.course.groupId)

    for (const group of groupIdGroups) {
      if (group.length === 1) {
        // Failed courses are only calculated for the original course and 1-to-1 substitutions
        const credits = studentCredits.filter(credit => credit.course.groupId === group[0])
        if (credits.length) {
          completedGroups.push(credits)
        }
      }
      // For substitution groups we must only get passed groups
      else if (group.every(groupId => groupIdsOfPassedCredits.includes(groupId))) {
        // The credit in question should always exist because we just checked that it does
        completedGroups.push(
          studentCredits.filter(credit => group.includes(credit.course_id) && CreditModel.passed(credit))
        )
      } else {
        // "Partially completed substitution, do not count towards anything"
      }
    }
  }

  return completedGroups.filter(group => group.length)
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

export const getEnrollmentsForCourses = async (
  groupIdGroups: string[][],
  allCourseIds: string[],
  unification: Unification,
  from: Date,
  to: Date
) => {
  const enrollments = await EnrollmentModel.findAll({
    raw: true,
    nest: true,
    attributes: ['studentnumber', 'enrollment_date_time', 'course_code', 'course_id', 'studyright_id'],
    where: {
      course_id: {
        [Op.in]: allCourseIds,
      },
      enrollment_date_time: {
        [Op.between]: [from, to],
        // Date when OK changed from Oodi to Sisu data, studyright_id is null before that date
        [Op.gte]: enrollmentTimeDateThreshold,
      },
      state: EnrollmentState.ENROLLED,
      is_open: getIsOpen(unification),
    },
    include: [
      {
        model: SemesterModel,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: now(),
          },
        },
      },
      {
        model: CourseModel,
        attributes: ['groupId'],
        required: true,
      },
    ],
  })

  const studentNumberToEnrollments = enrollments.reduce<Record<string, Enrollment[]>>((acc, enrollment) => {
    acc[enrollment.studentnumber] ??= []
    acc[enrollment.studentnumber].push(enrollment)
    return acc
  }, {})

  // Calculate all code groups that have enrollments for all of the courses in the group
  const completedEnrollments: Enrollment[][] = []
  for (const studentEnrollments of Object.values(studentNumberToEnrollments)) {
    const groupIdsOfEnrollments = studentEnrollments.map(enrollment => enrollment.course.groupId)

    for (const group of groupIdGroups) {
      if (group.every(groupId => groupIdsOfEnrollments.includes(groupId))) {
        completedEnrollments.push(
          studentEnrollments
            .filter(enrollment => group.includes(enrollment.course.groupId))
            .sort((a, b) => b.enrollment_date_time.getTime() - a.enrollment_date_time.getTime())
        )
      } else {
        // Partially completed enrollments for a group, skipping...
      }
    }
  }

  return completedEnrollments.filter(enrollmentGroup => enrollmentGroup.length)
}
