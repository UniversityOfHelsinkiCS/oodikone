import { memoize } from 'lodash-es'
import { Op, QueryTypes } from 'sequelize'

import { Name, CreditTypeCode, EnrollmentState } from '@oodikone/shared/types'
import { enrollmentTimeDateThreshold } from '@oodikone/shared/util'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import { dbConnections } from '../../database/connection'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, ProgrammeModuleModel } from '../../models'
import logger from '../../util/logger'

export const getAllProgrammeCourses = async (providerCode: string) => {
  const courses: Pick<CourseModel, 'id' | 'code' | 'name' | 'substitution_groups'>[] = await CourseModel.findAll({
    attributes: ['id', 'code', 'name', 'substitution_groups'],
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

const removeOpenUniCodePrefix = (code: string) => {
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
    const enrollmentsCourses: Array<
      Pick<EnrollmentModel, 'studentnumber' | 'course_code' | 'enrollment_date_time' | 'course'>
    > = await EnrollmentModel.findAll({
      raw: true,
      nest: true,
      attributes: ['studentnumber', 'course_code', 'enrollment_date_time'],
      include: {
        model: CourseModel,
        attributes: ['is_study_module'],
      },
      where: {
        course_code: {
          [Op.in]: programmeCourses,
        },
        enrollment_date_time: {
          [Op.between]: [from, to],
          [Op.gte]: enrollmentTimeDateThreshold,
        },
        state: EnrollmentState.ENROLLED,
      },
    })

    const allEnrollments = new Map<string, Set<string>>()
    for (const { studentnumber, course_code: courseCode } of enrollmentsCourses) {
      const code = removeOpenUniCodePrefix(courseCode)
      if (!allEnrollments.has(code)) {
        allEnrollments.set(code, new Set())
      }
      allEnrollments.get(code)!.add(studentnumber)
    }

    // TODO: This is being called for each year, could be optimized to call only once
    const credits: Array<
      Pick<
        CreditModel,
        'course_code' | 'student_studentnumber' | 'credittypecode' | 'isStudyModule' | 'attainment_date'
      >
    > = await CreditModel.findAll({
      raw: true,
      attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'isStudyModule', 'attainment_date'],
      where: {
        course_code: {
          [Op.in]: programmeCourses,
        },
      },
      order: [['credittypecode', 'ASC']], // Passed credits for a student have to be handled first
    })

    // Pick only this (between to, from) year's credits
    const filteredCredits = credits.filter(credit => dateIsBetween(credit.attainment_date, from, to))

    const courseCodeToName = (
      await CourseModel.findAll({
        raw: true,
        attributes: ['code', 'name'],
        where: {
          code: programmeCourses,
        },
      })
    ).reduce<Map<string, Name>>((acc, val) => {
      acc.set(val.code, val.name)
      return acc
    }, new Map())

    const creditCourses = filteredCredits.map(credit => ({
      code: removeOpenUniCodePrefix(credit.course_code),
      studentNumber: credit.student_studentnumber,
      creditTypeCode: credit.credittypecode,
      courseName: courseCodeToName.get(credit.course_code)!,
      isStudyModule: credit.isStudyModule,
    }))

    const passedByCourseCodes = new Map<string, Set<string>>()
    const notCompletedByCourseCodes = new Map<string, Set<string>>()
    const courses = new Map<string, { name: Name; isStudyModule: boolean }>()

    const studentHasPassedCourse = (studentNumber: string, courseCode: string) =>
      !!credits.find(
        credit =>
          credit.student_studentnumber === studentNumber &&
          credit.course_code === courseCode &&
          CreditModel.passed(credit)
      ) ||
      (passedByCourseCodes.get(courseCode)?.has(studentNumber) ?? false)

    for (const { code, courseName, creditTypeCode, isStudyModule, studentNumber } of creditCourses) {
      if (!courses.has(code)) {
        courses.set(code, {
          isStudyModule,
          name: courseName,
        })
        passedByCourseCodes.set(code, new Set())
        notCompletedByCourseCodes.set(code, new Set())
      }

      if (CreditModel.passed({ credittypecode: creditTypeCode })) {
        passedByCourseCodes.get(code)!.add(studentNumber)
      }
      if (creditTypeCode === CreditTypeCode.FAILED && !studentHasPassedCourse(studentNumber, code)) {
        notCompletedByCourseCodes.get(code)!.add(studentNumber)
      }
    }

    // Add course details to courseMap if there are only enrollments
    for (const { studentnumber: studentNumber, course_code: courseCode, course } of enrollmentsCourses) {
      if (!courses.has(courseCode)) {
        courses.set(courseCode, {
          isStudyModule: course.is_study_module,
          name: courseCodeToName.get(courseCode)!,
        })
        passedByCourseCodes.set(courseCode, new Set())
        notCompletedByCourseCodes.set(courseCode, new Set())
      }

      if (!studentHasPassedCourse(studentNumber, courseCode)) {
        notCompletedByCourseCodes.get(courseCode)!.add(studentNumber)
      }
    }
    return [...courses.entries()].map(([code, { isStudyModule, name }]) => {
      return {
        code,
        name,
        isStudyModule,
        allNotPassed: notCompletedByCourseCodes.get(code)?.size ?? 0,
      }
    })
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
