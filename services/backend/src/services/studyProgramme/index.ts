import { memoize } from 'lodash'
import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { Course, Credit, Enrollment, Organization, ProgrammeModule } from '../../models'
import { CreditTypeCode, EnrollmentState, Name } from '../../types'
import logger from '../../util/logger'

export const getAllProgrammeCourses = async (providerCode: string) => {
  const courses = await Course.findAll({
    attributes: ['id', 'code', 'name', 'substitutions'],
    include: [
      {
        model: Organization,
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
    const enrollmentsCourses = await Enrollment.findAll({
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

    const allEnrollments = {} as Record<string, string[]>
    for (const { studentnumber, course_code: courseCode } of enrollmentsCourses) {
      const code = getCourseCode(courseCode)
      if (!(code in allEnrollments)) {
        allEnrollments[code] = []
      }
      if (!allEnrollments[code].includes(studentnumber)) {
        allEnrollments[code].push(studentnumber)
      }
    }

    const credits = await Credit.findAll({
      attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'isStudyModule'],
      include: {
        model: Course,
        attributes: ['code', 'name'],
        required: true,
        where: {
          code: programmeCourses,
        },
      },
      where: {
        attainment_date: {
          [Op.between]: [from, to],
        },
      },
    })

    const creditCourses = credits.map(credit => {
      return {
        code: getCourseCode(credit.course_code),
        studentNumber: credit.student_studentnumber,
        creditTypeCode: credit.credittypecode,
        courseName: credit.course.name,
        isStudyModule: credit.isStudyModule,
      }
    })

    const passedByCourseCodes = {} as Record<string, string[]>
    const notCompletedByCourseCodes = {} as Record<string, string[]>
    const courses = {} as Record<string, { code: string; name: Name; isStudyModule: boolean }>
    for (const course of creditCourses) {
      if (!(course.code in courses)) {
        courses[course.code] = {
          code: course.code,
          name: course.courseName,
          isStudyModule: course.isStudyModule,
        }
        passedByCourseCodes[course.code] = []
        notCompletedByCourseCodes[course.code] = []
      }
      if ([CreditTypeCode.PASSED, CreditTypeCode.IMPROVED, CreditTypeCode.APPROVED].includes(course.creditTypeCode)) {
        passedByCourseCodes[course.code].push(course.studentNumber)
      }
      if (
        course.creditTypeCode === CreditTypeCode.FAILED &&
        !passedByCourseCodes[course.code].includes(course.studentNumber)
      ) {
        notCompletedByCourseCodes[course.code].push(course.studentNumber)
      }
    }

    // If student has enrollments, but no attainment for a particular course, they have no credit info.
    programmeCourses.forEach(courseCode => {
      if (allEnrollments[courseCode]) {
        allEnrollments[courseCode].forEach(studentnumber => {
          if (passedByCourseCodes[courseCode] && !passedByCourseCodes[courseCode].includes(studentnumber)) {
            notCompletedByCourseCodes[courseCode].push(studentnumber)
          }
        })
      }
    })

    return Object.keys(courses)
      .reduce(
        (acc, val) => [...acc, { ...courses[val] }],
        [] as Array<{ code: string; name: Name; isStudyModule: boolean }>
      )
      .map(course => ({
        code: course.code,
        name: course.name,
        type: 'notCompleted',
        isStudyModule: course.isStudyModule,
        totalNotCompleted: [...new Set(notCompletedByCourseCodes[course.code])].length,
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
  const programmeName = await ProgrammeModule.findOne({
    attributes: ['name'],
    where: {
      code,
    },
  })
  return programmeName?.name
}
