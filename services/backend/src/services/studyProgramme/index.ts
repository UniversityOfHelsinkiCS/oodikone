import { memoize } from 'lodash-es'
import { Op, QueryTypes } from 'sequelize'

import { Name, EnrollmentState } from '@oodikone/shared/types'
import { enrollmentTimeDateThresholdAcademicYear } from '@oodikone/shared/util'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import { dbConnections } from '../../database/connection'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, ProgrammeModuleModel } from '../../models'
import logger from '../../util/logger'

export const getAllProgrammeCourses = async (providerCode: string) => {
  const courses: Pick<CourseModel, 'id' | 'code' | 'name' | 'substitution_groups'>[] = await CourseModel.findAll({
    raw: true,
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
  })
  return courses
}

export const getNotCompletedForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  try {
    const enrollments: Array<
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
          [Op.gte]: enrollmentTimeDateThresholdAcademicYear, // This has to be Academic year to match with Course statistics which doesn't display enrollments for ...-2021
        },
        state: EnrollmentState.ENROLLED,
      },
      order: [['enrollment_date_time', 'DESC']],
    })

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
      order: [
        ['attainment_date', 'DESC'],
        ['credittypecode', 'ASC'],
      ], // Passed credits for a student have to be handled first (only PASSED, and FAILED matter)
    })

    const enrolledStudentsByCourseCode = new Map<string, Set<string>>()

    // Pick only this (between to, from) year's credits
    const filteredCredits = credits.filter(credit => dateIsBetween(credit.attainment_date, from, to))

    const filteredEnrollments = enrollments
      // Only include the first enrollment for a course for a student.
      // This assumes that enrollments are sorted in DESC order by enrollment_date_time
      .filter(({ course_code: courseCode, studentnumber: studentNumber }) => {
        const courseEnrollments = enrolledStudentsByCourseCode.get(courseCode)
        const hasEnrolled = courseEnrollments?.has(studentNumber) ?? false

        if (!courseEnrollments) enrolledStudentsByCourseCode.set(courseCode, new Set<string>())
        if (!hasEnrolled) enrolledStudentsByCourseCode.get(courseCode)!.add(studentNumber)

        return !hasEnrolled
      })
      .filter(enrollment => dateIsBetween(enrollment.enrollment_date_time, from, to))

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
      code: credit.course_code,
      studentNumber: credit.student_studentnumber,
      creditTypeCode: credit.credittypecode,
      courseName: courseCodeToName.get(credit.course_code)!,
      isStudyModule: credit.isStudyModule,
      attainmentDate: credit.attainment_date,
    }))

    const passedByCourseCodes = new Map<string, Set<string>>()
    const failedByCourseCodes = new Map<string, Set<string>>()
    const notCompletedByCourseCodes = new Map<string, Set<string>>()
    const courses = new Map<string, { name: Name; isStudyModule: boolean }>()

    const studentHasPassedCourse = (studentNumber: string, courseCode: string): boolean =>
      (passedByCourseCodes.get(courseCode)?.has(studentNumber) ?? false) ||
      !!credits.find(
        credit =>
          credit.student_studentnumber === studentNumber &&
          credit.course_code === courseCode &&
          CreditModel.passed(credit)
      )

    /** Student has already been counted as failed or there is a newer failed credit */
    const studentHasFailedCourse = (
      studentNumber: string,
      courseCode: string,
      attainmentDate: Date = new Date(0)
    ): boolean =>
      (failedByCourseCodes.get(courseCode)?.has(studentNumber) ?? false) ||
      !!credits.find(
        credit =>
          credit.student_studentnumber === studentNumber &&
          credit.course_code === courseCode &&
          CreditModel.failed(credit) &&
          credit.attainment_date > attainmentDate
      )

    const studentHasCredit = (studentNumber: string, courseCode: string): boolean =>
      studentHasPassedCourse(studentNumber, courseCode) || studentHasFailedCourse(studentNumber, courseCode)

    for (const {
      code: courseCode,
      courseName,
      creditTypeCode,
      isStudyModule,
      studentNumber,
      attainmentDate,
    } of creditCourses) {
      if (!courses.has(courseCode)) {
        courses.set(courseCode, {
          isStudyModule,
          name: courseName,
        })
        passedByCourseCodes.set(courseCode, new Set())
        failedByCourseCodes.set(courseCode, new Set())
        notCompletedByCourseCodes.set(courseCode, new Set())
      }

      if (CreditModel.passed({ credittypecode: creditTypeCode })) {
        passedByCourseCodes.get(courseCode)!.add(studentNumber)
      }
      if (
        CreditModel.failed({ credittypecode: creditTypeCode }) &&
        !studentHasPassedCourse(studentNumber, courseCode) &&
        !studentHasFailedCourse(studentNumber, courseCode, attainmentDate)
      ) {
        failedByCourseCodes.get(courseCode)!.add(studentNumber)
      }
    }

    // Add course details to courseMap if there are only enrollments
    for (const { studentnumber: studentNumber, course_code: courseCode, course } of filteredEnrollments) {
      if (!courses.has(courseCode)) {
        courses.set(courseCode, {
          isStudyModule: course.is_study_module,
          name: courseCodeToName.get(courseCode)!,
        })
        passedByCourseCodes.set(courseCode, new Set())
        failedByCourseCodes.set(courseCode, new Set())
        notCompletedByCourseCodes.set(courseCode, new Set())
      }

      if (!studentHasCredit(studentNumber, courseCode)) {
        notCompletedByCourseCodes.get(courseCode)!.add(studentNumber)
      }
    }

    return [...courses.entries()].map(([code, { isStudyModule, name }]) => {
      return {
        code,
        name,
        isStudyModule,
        allNotPassed: (notCompletedByCourseCodes.get(code)?.size ?? 0) + (failedByCourseCodes.get(code)?.size ?? 0),
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
