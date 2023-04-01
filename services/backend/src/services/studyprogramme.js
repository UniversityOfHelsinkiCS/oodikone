const _ = require('lodash')
const Sequelize = require('sequelize')
const {
  dbConnections: { sequelize },
} = require('../database/connection')
const moment = require('moment')
const { Op } = Sequelize
const {
  Credit,
  Course,
  Organization,
  Studyright,
  StudyrightElement,
  ElementDetail,
  ProgrammeModule,
  Transfer,
  Student,
  SemesterEnrollment,
  Semester,
  Enrollment,
} = require('../models')
const { formatStudyright, formatStudent, formatTransfer } = require('./studyprogrammeHelpers')
const { getCurrentSemester } = require('./semesters')
const logger = require('../util/logger')

const whereStudents = studentnumbers => {
  return studentnumbers ? studentnumbers : { [Op.not]: null }
}

const sinceDate = since => {
  return since ? { [Op.gte]: since } : { [Op.not]: null }
}

const studytrackStudents = async studentnumbers =>
  (
    await Student.findAll({
      include: {
        model: Credit,
        separate: true,
        attributes: ['credits', 'attainment_date'],
        where: {
          [Op.or]: [{ isStudyModule: null }, { isStudyModule: false }],
          credittypecode: {
            [Op.in]: [4, 9],
          },
        },
      },
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
    })
  ).map(formatStudent)

const enrolledStudents = async (studytrack, since, studentnumbers) => {
  const currentSemester = await getCurrentSemester()

  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid'],
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode'],
        include: [
          {
            model: Semester,
            required: true,
            where: {
              semestercode: currentSemester.semestercode,
            },
          },
        ],
        where: {
          enrollmenttype: 1,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students.filter(s => s.semester_enrollments?.length)
}

const absentStudents = async (studytrack, studentnumbers) => {
  const currentSemester = await getCurrentSemester()
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid'],
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode'],
        where: {
          enrollmenttype: 2,
          semestercode: currentSemester.semestercode,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students
}

const allStudyrights = async (studytrack, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const startedStudyrights = async (studytrack, since, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        studystartdate: {
          [Op.gte]: since,
        },
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const graduatedStudyRights = async (studytrack, since, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
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

const inactiveStudyrights = async (studytrack, studentnumbers) => {
  const now = moment(new Date())
  const inactiveOrExpired = (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        student_studentnumber: whereStudents(studentnumbers),
        graduated: 0,
      },
    })
  )
    .filter(s => s.active === 0 || (s.enddate && moment(s.enddate).isBefore(now)))
    .map(formatStudyright)

  return inactiveOrExpired
}

const followingStudyrights = async (since, programmes, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: programmes.map(p => p.code),
            },
          },
          include: [
            {
              model: ElementDetail,
              attributes: ['name', 'code', 'type'],
            },
          ],
          attributes: ['code'],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        studystartdate: {
          [Op.gte]: since,
        },
        extentcode: 2,
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const previousStudyrights = async (programmes, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: programmes.map(p => p.code),
            },
          },
          include: [
            {
              model: ElementDetail,
              attributes: ['name', 'code', 'type'],
            },
          ],
          attributes: ['code'],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        extentcode: 1,
        student_studentnumber: whereStudents(studentnumbers),
      },
      order: [[StudyrightElement, 'startdate', 'DESC']],
    })
  ).map(formatStudyright)

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

const getProgrammesStudyrights = async studyprogramme =>
  (
    await Studyright.findAll({
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode', 'cancelled'],
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: [studyprogramme],
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)

const getStudyRights = async students =>
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
      ],
      where: {
        studentStudentnumber: students,
      },
      include: [
        {
          model: StudyrightElement,
          include: {
            model: ElementDetail,
            where: {
              type: 20,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)

const getCreditsForStudyProgramme = async (codes, since) => {
  const res = await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
        code: codes,
      },
    },
    where: {
      credittypecode: 4,
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })
  return res
}

const getCourseCodesForStudyProgramme = async provider => {
  const coursesByProvider = await Course.findAll({
    attributes: ['code', 'substitutions'],
    where: {
      is_study_module: false,
    },
    include: {
      model: Organization,
      required: true,
      where: {
        code: provider,
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
    attributes: ['code', 'substitutions'],
    include: [
      {
        model: Organization,
        attributes: [],
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

const getStudentsForProgrammeCourses = async (from, to, programmeCourses) => {
  try {
    const res = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits, 
         co.code AS code, co.name AS course_name FROM credit cr
         INNER JOIN course co ON cr.course_code = co.code
         WHERE cr.attainment_date BETWEEN :from AND :to
         AND cr.course_code IN (:programmeCourses)
         AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
         AND cr.credittypecode = 4
         )
         SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name
         FROM Dist
         GROUP BY dist.code, course_name;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { from, to, programmeCourses },
      }
    )
    return res.map(course => ({
      code: course.code,
      name: course.course_name,
      year: course.year,
      totalPassed: parseInt(course.total_students),
      totalAllcredits: parseInt(course.total_credits),
      type: 'passed',
    }))
  } catch (e) {
    // eslint-disable-next-line no-console
    logger.log(e)
  }
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
    const allEnrollments = {}
    for (const { studentnumber, course_code } of enrollmentsCourses) {
      if (!(course_code in allEnrollments)) {
        allEnrollments[course_code] = []
      }
      allEnrollments[course_code].push(studentnumber)
    }

    const credits = await Credit.findAll({
      attributes: ['id', 'course_code', 'student_studentnumber', 'credittypecode', 'attainment_date'],
      include: {
        model: Course,
        attributes: ['code', 'name'],
        required: true,
        where: {
          is_study_module: false,
          code: programmeCourses,
        },
      },
      where: {
        credittypecode: [4, 7, 10],
        isStudyModule: {
          [Op.not]: true,
        },
        attainment_date: {
          [Op.between]: [from, to],
        },
      },
    })
    const creditsObj = credits.map(credit => {
      return {
        code: credit.course_code,
        studentnumber: credit.student_studentnumber,
        credittype: credit.credittypecode,
        courseName: credit.course.name,
        year: moment(credit.attainment_date).year(),
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
          year: course.year,
        }

        passedByCourseCodes[course.code] = []
        notCompletedByCourseCodes[course.code] = []
      }
      if ([4, 7].includes(course.credittype)) {
        passedByCourseCodes[course.code].push(course.studentnumber)
      }
      if (
        (allEnrollments[course.code]?.includes(course.studentnumber) || course.credittype === 10) &&
        !passedByCourseCodes[course.code].includes(course.studentnumber)
      ) {
        notCompletedByCourseCodes[course.code].push(course.studentnumber)
      }
    }

    return Object.keys(courses)
      .reduce((acc, val) => [...acc, { ...courses[val] }], [])
      .map(course => ({
        code: course.code,
        name: course.name,
        year: course.year,
        totalNotCompleted: [...new Set(notCompletedByCourseCodes[course.code])].length,
        type: 'notCompleted',
      }))
  } catch (e) {
    // eslint-disable-next-line no-console
    logger.log(e)
  }
}
const getOwnStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
        co.code AS code, co.name AS course_name FROM credit cr
        INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
        INNER JOIN course co ON cr.course_code = co.code
        INNER JOIN course_providers cp ON cp.coursecode = co.id
        INNER JOIN organization o ON o.id = cp.organizationcode
        WHERE cr.attainment_date BETWEEN :from AND :to
        AND cr.course_code IN (:programmeCourses)
        AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
        AND cr.credittypecode = 4
        AND (se.code = :studyprogramme AND cr.attainment_date BETWEEN se.startdate AND se.enddate)
    )
     SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name
       FROM Dist
       GROUP BY dist.code, course_name;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  return res.map(course => {
    const res = {
      code: course.code,
      name: course.course_name,
      totalProgrammeStudents: parseInt(course.total_students),
      totalProgrammeCredits: parseInt(course.total_credits),
      type: 'ownProgramme',
    }
    return res
  })
}

const getOtherStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name FROM credit cr
      INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
      AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
      AND cr.credittypecode = 4
      AND cr.student_studentnumber IN
        (
        SELECT student_studentnumber FROM studyright_elements
        WHERE studyright_elements.studentnumber = cr.student_studentnumber
        AND (studyright_elements.code != :studyprogramme AND cr.attainment_date BETWEEN studyright_elements.startdate AND studyright_elements.enddate)
        AND cr.student_studentnumber NOT IN
          (
          SELECT studentnumber FROM studyright_elements
          WHERE studyright_elements.studentnumber = cr.student_studentnumber
          AND (studyright_elements.code = :studyprogramme AND cr.attainment_date BETWEEN studyright_elements.startdate AND studyright_elements.enddate)) 
          )
      )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name
      FROM Dist
      GROUP BY dist.code, course_name;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalOtherProgrammeStudents: parseInt(course.total_students),
    totalOtherProgrammeCredits: parseInt(course.total_credits),
    type: 'otherProgramme',
  }))
}

const getTransferStudentsForProgrammeCourses = async (from, to, programmeCourses) => {
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 9
      )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name
      FROM Dist
      GROUP BY dist.code, course_name;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalTransferStudents: parseInt(course.total_students),
    totalTransferCredits: parseInt(course.total_credits),
    type: 'transfer',
  }))
}

const getStudentsWithoutStudyrightForProgrammeCourses = async (from, to, programmeCourses) => {
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 4
      AND cr.student_studentnumber NOT IN
        (
        SELECT student_studentnumber FROM studyright_elements
        WHERE studyright_elements.studentnumber = cr.student_studentnumber
        AND cr.attainment_date BETWEEN studyright_elements.startdate AND studyright_elements.enddate)
      )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name
      FROM Dist
      GROUP BY dist.code, course_name;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalWithoutStudyrightStudents: parseInt(course.total_students),
    totalWithoutStudyrightCredits: parseInt(course.total_credits),
    type: 'noStudyright',
  }))
}

const getTransferredCredits = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.eq]: [9],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getThesisCredits = async (provider, since, thesisType, studentnumbers) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        course_unit_type: {
          [Op.in]: thesisType,
        },
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
      student_studentnumber: whereStudents(studentnumbers),
    },
  })

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
  studytrackStudents,
  enrolledStudents,
  absentStudents,
  allStudyrights,
  startedStudyrights,
  graduatedStudyRights,
  inactiveStudyrights,
  previousStudyrights,
  followingStudyrights,
  transfersAway,
  transfersTo,
  allTransfers,
  getProgrammesStudyrights,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
  getStudentsForProgrammeCourses,
  getCurrentStudyYearStartDate,
  getOwnStudentsForProgrammeCourses,
  getStudentsWithoutStudyrightForProgrammeCourses,
  getOtherStudentsForProgrammeCourses,
  getAllProgrammeCourses,
  getStudyRights,
  getCourseCodesForStudyProgramme,
  getTransferStudentsForProgrammeCourses,
  getProgrammeName,
  getNotCompletedForProgrammeCourses,
}
