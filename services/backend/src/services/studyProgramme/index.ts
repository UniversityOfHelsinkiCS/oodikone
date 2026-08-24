import { memoize } from 'lodash-es'
import { Op, QueryTypes } from 'sequelize'

import { EnrollmentState } from '@oodikone/shared/types'
import { enrollmentTimeDateThresholdAcademicYear } from '@oodikone/shared/util'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import { dbConnections } from '../../database/connection'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, ProgrammeModuleModel } from '../../models'
import logger from '../../util/logger'

export const getAllProgrammeCourses = async (providerCode: string) => {
  const courses: Pick<CourseModel, 'id' | 'groupId' | 'code' | 'name'>[] = await CourseModel.findAll({
    raw: true,
    attributes: ['id', 'groupId', 'code', 'name'],
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

export const getCoursesByGroupIds = async (groupIds: string[]) => {
  if (groupIds.length === 0) return []
  return (
    await CourseModel.findAll({
      raw: true,
      attributes: ['id'],
      where: { groupId: { [Op.in]: groupIds } },
    })
  ).map(course => course.id)
}

export const getPrimaryCoursesByGroupIds = async (
  groupIds: string[]
): Promise<Pick<CourseModel, 'code' | 'name' | 'groupId'>[]> => {
  if (groupIds.length === 0) return []
  return CourseModel.findAll({
    raw: true,
    attributes: ['code', 'name', 'groupId'],
    where: { groupId: { [Op.in]: groupIds }, isPrimary: true },
  })
}

type NotCompletedCourseRow = {
  groupId: string
  isStudyModule: boolean
  allNotPassed: number
}

export const getNotCompletedForProgrammeCourses = async (
  programmeCourseIds: string[],
  yearRanges: Array<{ year: number; from: Date; to: Date }>,
  start: Date,
  end: Date
): Promise<Map<number, NotCompletedCourseRow[]>> => {
  const emptyResult = new Map<number, NotCompletedCourseRow[]>(yearRanges.map(({ year }) => [year, []]))

  try {
    const [enrollments, credits]: [
      Pick<EnrollmentModel, 'studentnumber' | 'enrollment_date_time' | 'course'>[],
      Pick<CreditModel, 'student_studentnumber' | 'credittypecode' | 'isStudyModule' | 'attainment_date' | 'course'>[],
    ] = await Promise.all([
      EnrollmentModel.findAll({
        raw: true,
        nest: true,
        attributes: ['studentnumber', 'enrollment_date_time'],
        include: {
          model: CourseModel,
          attributes: ['isStudyModule', 'groupId'],
        },
        where: {
          course_id: {
            [Op.in]: programmeCourseIds,
          },
          enrollment_date_time: {
            [Op.and]: {
              [Op.between]: [start, end],
              [Op.gte]: enrollmentTimeDateThresholdAcademicYear, // This has to be Academic year to match with Course statistics which doesn't display enrollments for ...-2021
            },
          },
          state: EnrollmentState.ENROLLED,
        },
        order: [['enrollment_date_time', 'DESC']],
      }),
      CreditModel.findAll({
        raw: true,
        nest: true,
        attributes: ['student_studentnumber', 'credittypecode', 'isStudyModule', 'attainment_date'],
        include: {
          model: CourseModel,
          attributes: ['groupId'],
        },
        where: {
          course_id: {
            [Op.in]: programmeCourseIds,
          },
          attainment_date: {
            [Op.between]: [start, end],
          },
        },
        order: [
          ['attainment_date', 'DESC'],
          ['credittypecode', 'ASC'],
        ], // Passed credits for a student have to be handled first (only PASSED, and FAILED matter)
      }),
    ])

    const creditKey = (studentNumber: string, courseGroupId: string) => `${studentNumber}::${courseGroupId}`

    const everPassedByStudentCourse = new Set<string>()
    const latestFailedDateByStudentCourse = new Map<string, Date>()

    for (const credit of credits) {
      const groupId = credit.course.groupId

      if (CreditModel.passed(credit)) {
        everPassedByStudentCourse.add(creditKey(credit.student_studentnumber, groupId))
      }

      if (CreditModel.failed(credit)) {
        const mapKey = creditKey(credit.student_studentnumber, groupId)
        const latestFailedDate = latestFailedDateByStudentCourse.get(mapKey)
        if (!latestFailedDate || credit.attainment_date > latestFailedDate) {
          latestFailedDateByStudentCourse.set(mapKey, credit.attainment_date)
        }
      }
    }

    const enrolledStudentsByCourseGroupId = new Map<string, Set<string>>()

    // Only include the latest enrollment for a course per student per given time range.
    // This assumes that enrollments are sorted in DESC order by enrollment_date_time
    const dedupedEnrollments = enrollments.filter(({ course, studentnumber: studentNumber }) => {
      const groupId = course.groupId
      const courseEnrollments = enrolledStudentsByCourseGroupId.get(groupId)
      const hasEnrolled = !!courseEnrollments?.has(studentNumber)

      if (!courseEnrollments) enrolledStudentsByCourseGroupId.set(groupId, new Set<string>())
      if (!hasEnrolled) enrolledStudentsByCourseGroupId.get(groupId)!.add(studentNumber)

      return !hasEnrolled
    })

    const result = new Map<number, NotCompletedCourseRow[]>()

    for (const { year, from, to } of yearRanges) {
      const filteredCredits = credits.filter(credit => dateIsBetween(credit.attainment_date, from, to))
      const filteredEnrollments = dedupedEnrollments.filter(enrollment =>
        dateIsBetween(enrollment.enrollment_date_time, from, to)
      )

      // Keys are groupIds
      const failedByCourse = new Map<string, Set<string>>()
      const notCompletedByCourse = new Map<string, Set<string>>()
      const courses = new Map<string, { isStudyModule: boolean }>()

      const studentHasPassedCourse = (studentNumber: string, courseGroupId: string): boolean =>
        everPassedByStudentCourse.has(creditKey(studentNumber, courseGroupId))

      // Whether there is a newer failed credit
      const studentHasFailedCourse = (
        studentNumber: string,
        courseGroupId: string,
        attainmentDate: Date = new Date(0)
      ): boolean => {
        const latestFailedDate = latestFailedDateByStudentCourse.get(creditKey(studentNumber, courseGroupId))
        return !!latestFailedDate && latestFailedDate > attainmentDate
      }

      const studentHasCredit = (studentNumber: string, courseGroupId: string): boolean =>
        studentHasPassedCourse(studentNumber, courseGroupId) || studentHasFailedCourse(studentNumber, courseGroupId)

      const ensureCourseExists = (groupId: string, isStudyModule: boolean) => {
        if (!courses.has(groupId)) {
          courses.set(groupId, {
            isStudyModule,
          })
          failedByCourse.set(groupId, new Set())
          notCompletedByCourse.set(groupId, new Set())
        }
      }

      for (const {
        credittypecode: creditTypeCode,
        isStudyModule,
        student_studentnumber: studentNumber,
        attainment_date: attainmentDate,
        course,
      } of filteredCredits) {
        const groupId = course.groupId
        ensureCourseExists(groupId, isStudyModule)

        if (
          CreditModel.failed({ credittypecode: creditTypeCode }) &&
          !studentHasPassedCourse(studentNumber, groupId) &&
          !studentHasFailedCourse(studentNumber, groupId, attainmentDate)
        ) {
          failedByCourse.get(groupId)!.add(studentNumber)
        }
      }

      // Add course details to courseMap if there are only enrollments
      for (const { studentnumber: studentNumber, course } of filteredEnrollments) {
        const groupId = course.groupId
        ensureCourseExists(groupId, course.isStudyModule)

        if (!studentHasCredit(studentNumber, groupId)) {
          notCompletedByCourse.get(groupId)!.add(studentNumber)
        }
      }

      result.set(
        year,
        [...courses.entries()].map(([groupId, { isStudyModule }]) => ({
          groupId,
          isStudyModule,
          allNotPassed: (notCompletedByCourse.get(groupId)?.size ?? 0) + (failedByCourse.get(groupId)?.size ?? 0),
        }))
      )
    }

    return result
  } catch (error) {
    logger.error(`getNotCompletedForProgrammeCourses failed ${error}`)
    return emptyResult
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
