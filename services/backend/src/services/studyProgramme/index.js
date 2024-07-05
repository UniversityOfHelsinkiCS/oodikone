const { memoize } = require('lodash')
const { Op } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { Course, Credit, Enrollment, Organization, ProgrammeModule, Transfer } = require('../../models')
const logger = require('../../util/logger')
const { formatTransfer } = require('./studyProgrammeHelpers')

const whereStudents = studentnumbers => {
  return studentnumbers || { [Op.not]: null }
}

const sinceDate = since => {
  return since ? { [Op.gte]: since } : { [Op.not]: null }
}

const transfersAway = async (studytrack, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: studytrack,
      },
    })
  ).map(formatTransfer)

const transfersTo = async (studytrack, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        targetcode: studytrack,
      },
    })
  ).map(formatTransfer)

const allTransfers = async (studytrack, since) => {
  const transferredTo = await transfersTo(studytrack, since)
  const transferredAway = await transfersAway(studytrack, since)
  return [...transferredTo, ...transferredAway]
}

const getAllProgrammeCourses = async providerCode => {
  const res = await Course.findAll({
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
  return res
}

const getNotCompletedForProgrammeCourses = async (from, to, programmeCourses) => {
  try {
    const enrollmentsCourses = await Enrollment.findAll({
      attributes: ['studentnumber', 'course_code'],
      where: {
        course_code: {
          [Op.in]: programmeCourses,
        },
        studentnumber: {
          [Op.ne]: null,
        },
        enrollment_date_time: {
          [Op.between]: [from, to],
        },
        state: 'ENROLLED',
      },
    })
    const getCourseCode = code => {
      if (code.startsWith('AY')) return code.replace('AY', '')
      if (code.startsWith('A')) return code.replace('AY', '')
      return code
    }
    const allEnrollments = {}
    for (const { studentnumber, course_code } of enrollmentsCourses) {
      const code = getCourseCode(course_code)
      if (!(code in allEnrollments)) {
        allEnrollments[code] = []
      }
      if (!allEnrollments[code].includes(studentnumber)) allEnrollments[code].push(studentnumber)
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

    const creditsObj = credits.map(credit => {
      return {
        code: getCourseCode(credit.course_code),
        studentnumber: credit.student_studentnumber,
        credittype: credit.credittypecode,
        courseName: credit.course.name,
        isStudyModule: credit.isStudyModule,
      }
    })

    const passedByCourseCodes = {}
    const notCompletedByCourseCodes = {}
    const courses = {}
    for (const course of creditsObj) {
      if (!(course.code in courses)) {
        courses[course.code] = {
          code: course.code,
          name: course.courseName,
          isStudyModule: course.isStudyModule,
        }

        passedByCourseCodes[course.code] = []
        notCompletedByCourseCodes[course.code] = []
      }
      if ([4, 7, 9].includes(course.credittype)) {
        passedByCourseCodes[course.code].push(course.studentnumber)
      }
      if (course.credittype === 10 && !passedByCourseCodes[course.code].includes(course.studentnumber)) {
        notCompletedByCourseCodes[course.code].push(course.studentnumber)
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
      .reduce((acc, val) => [...acc, { ...courses[val] }], [])
      .map(course => ({
        code: course.code,
        name: course.name,
        totalNotCompleted: [...new Set(notCompletedByCourseCodes[course.code])].length,
        type: 'notCompleted',
        isStudyModule: course.isStudyModule,
      }))
  } catch (error) {
    logger.error(`getNotCompletedForProgrammeCourses failed ${error}`)
  }
}

const getCurrentStudyYearStartDate = memoize(
  async unixMillis =>
    new Date(
      (
        await sequelize.query(
          `
      SELECT startdate FROM SEMESTERS s WHERE yearcode = (SELECT yearcode FROM SEMESTERS WHERE startdate < :a ORDER BY startdate DESC LIMIT 1) ORDER BY startdate LIMIT 1;
      `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { a: new Date(unixMillis) },
          }
        )
      )[0].startdate
    )
)

const getProgrammeName = async code => {
  return ProgrammeModule.findOne({
    attributes: ['name'],
    where: {
      code,
    },
  })
}

module.exports = {
  allTransfers,
  getCurrentStudyYearStartDate,
  getAllProgrammeCourses,
  getProgrammeName,
  getNotCompletedForProgrammeCourses,
  whereStudents,
  sinceDate,
}
