import { memoize } from 'lodash-es'
import { Op, QueryTypes } from 'sequelize'

import { Name, CreditTypeCode, EnrollmentState } from '@oodikone/shared/types'
import { dbConnections } from '../../database/connection'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, ProgrammeModuleModel } from '../../models'
import logger from '../../util/logger'

export const getAllProgrammeCourses = async (providerCode: string) => {
  const courses = await CourseModel.findAll({
    attributes: ['id', 'code', 'name', 'substitutions'],
    include: [
      {
        model: OrganizationModel,
        attributes: ['id'],
        required: true,
        where: {
          code: providerCode,
        },
        through: {
          attributes: [],
        },
      },
    ],
    raw: true,
  })
  return courses
}

const getCourseCode = (code: string) => {
  if (code.startsWith('AY')) {
    return code.replace('AY', '')
  }
  if (code.startsWith('A')) {
    return code.replace('A', '')
  }
  return code
}

export const getNotCompletedForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  try {
    const enrollmentsCourses = await EnrollmentModel.findAll({
      attributes: ['studentnumber', 'course_code'],
      where: {
        course_code: {
          [Op.in]: programmeCourses,
        },
        enrollment_date_time: {
          [Op.between]: [from, to],
        },
        state: EnrollmentState.ENROLLED,
      },
    })

    const allEnrollments = new Map<string, Set<string>>()
    for (const { studentnumber, course_code: courseCode } of enrollmentsCourses) {
      const code = getCourseCode(courseCode)
      if (!allEnrollments.has(code)) {
        allEnrollments.set(code, new Set())
      }
      allEnrollments.get(code)!.add(studentnumber)
    }

    const credits = await CreditModel.findAll({
      attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'isStudyModule'],
      where: {
        course_code: {
          [Op.in]: programmeCourses,
        },
        attainment_date: {
          [Op.between]: [from, to],
        },
      },
    })

    const courseCodeToName = (
      await CourseModel.findAll({
        attributes: ['code', 'name'],
        where: {
          code: programmeCourses,
        },
      })
    ).reduce<Map<string, Name>>((acc, val) => {
      acc.set(val.code, val.name)
      return acc
    }, new Map())

    const creditCourses = credits.map(credit => ({
      code: getCourseCode(credit.course_code),
      studentNumber: credit.student_studentnumber,
      creditTypeCode: credit.credittypecode,
      courseName: courseCodeToName.get(credit.course_code)!,
      isStudyModule: credit.isStudyModule,
    }))

    const passedByCourseCodes = new Map<string, Set<string>>()
    const notCompletedByCourseCodes = new Map<string, Set<string>>()
    const courses = new Map<string, { name: Name; isStudyModule: boolean }>()

    for (const { code, courseName, creditTypeCode, isStudyModule, studentNumber } of creditCourses) {
      if (!courses.has(code)) {
        courses.set(code, {
          isStudyModule,
          name: courseName,
        })
        passedByCourseCodes.set(code, new Set())
        notCompletedByCourseCodes.set(code, new Set())
      }
      if ([CreditTypeCode.PASSED, CreditTypeCode.IMPROVED, CreditTypeCode.APPROVED].includes(creditTypeCode)) {
        passedByCourseCodes.get(code)!.add(studentNumber)
      }
      if (creditTypeCode === CreditTypeCode.FAILED && !passedByCourseCodes.get(code)!.has(studentNumber)) {
        notCompletedByCourseCodes.get(code)!.add(studentNumber)
      }
    }

    // If student has enrollments, but no attainment for a particular course, they have no credit info.
    programmeCourses.forEach(courseCode => {
      allEnrollments.get(courseCode)?.forEach(studentnumber => {
        if (passedByCourseCodes.get(courseCode)?.has(studentnumber)) {
          notCompletedByCourseCodes.get(courseCode)?.add(studentnumber)
        }
      })
    })

    return [...courses.entries()].map(([code, { isStudyModule, name }]) => ({
      code,
      name,
      isStudyModule,
      allNotPassed: notCompletedByCourseCodes.get(code)?.size ?? 0,
    }))
  } catch (error) {
    logger.error(`getNotCompletedForProgrammeCourses failed ${error}`)
    return []
  }
}

export const getCurrentStudyYearStartDate = memoize(async (unixMillis: number) => {
  const startDates: Array<{ startdate: Date }> = await dbConnections.sequelize.query(
    `
      SELECT startdate
      FROM semesters s
      WHERE yearcode = (SELECT yearcode FROM semesters WHERE startdate < :currentDate ORDER BY startdate DESC LIMIT 1)
      ORDER BY startdate
      LIMIT 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { currentDate: new Date(unixMillis) },
    }
  )
  return new Date(startDates[0].startdate)
})

export const getProgrammeName = async (code: string) => {
  const programmeName = await ProgrammeModuleModel.findOne({
    attributes: ['name'],
    where: {
      code,
    },
  })
  return programmeName?.name
}
