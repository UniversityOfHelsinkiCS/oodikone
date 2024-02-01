const _ = require('lodash')
const Sequelize = require('sequelize')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { Op } = Sequelize
const { Credit, Course, Organization, ProgrammeModule, Transfer, Enrollment } = require('../../models')
const { formatTransfer } = require('./studyprogrammeHelpers')
const logger = require('../../util/logger')

const whereStudents = studentnumbers => {
  return studentnumbers ? studentnumbers : { [Op.not]: null }
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

const getCourseCodesForStudyProgramme = async provider => {
  const coursesByProvider = await Course.findAll({
    attributes: ['id', 'code', 'substitutions'],
    include: {
      model: Organization,
      required: true,
      where: {
        code: provider,
      },
      through: {
        attributes: [],
      },
    },
  })

  const coursesWithOpenUniSubstitutions = coursesByProvider.map(({ code, substitutions }) => {
    if (!substitutions || !substitutions.length) return [code]
    const alternatives = [`AY-${code}`, `AY${code}`, `A-${code}`]
    return [code].concat(substitutions.filter(sub => alternatives.includes(sub)))
  })

  return coursesWithOpenUniSubstitutions.flat()
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
  } catch (e) {
    logger.error(`getNotCompletedForProgrammeCourses failed ${e}`)
  }
}

const getCurrentStudyYearStartDate = _.memoize(
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
  transfersAway,
  transfersTo,
  allTransfers,
  getCurrentStudyYearStartDate,
  getAllProgrammeCourses,
  getCourseCodesForStudyProgramme,
  getProgrammeName,
  getNotCompletedForProgrammeCourses,
  whereStudents,
  sinceDate,
}
