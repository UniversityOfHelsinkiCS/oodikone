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
  Transfer,
  Student,
  SemesterEnrollment,
  Semester,
} = require('../models')
const { formatStudyright, formatStudent, formatTransfer } = require('./studyprogrammeHelpers')
const { getCurrentSemester } = require('./semesters')

const whereStudents = studentnumbers => {
  return studentnumbers ? studentnumbers : { [Op.not]: null }
}

const sinceDate = since => {
  return since ? { [Op.gte]: since } : { [Op.not]: null }
}

const studytrackStudents = async studentnumbers =>
  (
    await Student.findAll({
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
              attributes: ['name'],
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
              attributes: ['name'],
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
      distinct: true,
      col: 'studentnumber',
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
      distinct: true,
      col: 'studentnumber',
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
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode'],
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

const getCreditsForStudyProgramme = async (provider, since) => {
  const res = await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
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
    },
  })
  return res
}

/* const getStudentsForProgrammeCourses = async (from, to, providerCode) => {
  try {
    const res = await Course.findAll({
      attributes: ['code', 'id', 'name', [sequelize.fn('COUNT', sequelize.col('student_studentnumber')), 'total']],
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
        {
          model: Credit,
          attributes: [],
          // include: [{ model: Student, required: false, attributes: ['lastname'] }],
          where: {
            credittypecode: {
              [Op.notIn]: [10, 9, 7],
            },
            isStudyModule: {
              [Op.not]: true,
            },
            attainment_date: {
              [Op.between]: [from, to],
            },
          },
        },
      ],
      raw: true,
      group: ['course.code', 'course.id'],
    })

    const result = res.map(course => ({
      code: course.code,
      name: course.name,
      year: course.year,
      totalAll: parseInt(course.total),
    }))
    return result
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('error: ', e)
  }
} */

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
    SELECT COUNT(DISTINCT(cr.student_studentnumber)) AS total, co.code, co.name FROM credit cr
    INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
    INNER JOIN course co ON cr.course_code = co.code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE cr.attainment_date BETWEEN :from AND :to
    AND cr.course_code IN (:programmeCourses)
    AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
    AND cr.credittypecode IN (4, 9)
    GROUP BY co.id, co.code;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { from, to, programmeCourses /*providerCode */ },
      }
    )
    // console.log('1: ', res.length)
    return res.map(course => ({
      code: course.code,
      name: course.name,
      year: course.year,
      totalAll: parseInt(course.total),
    }))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
}

const getOwnStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  // console.log('provider code: ', providerCode)
  // console.log('studyprogramme: ', studyprogramme)
  const res = await sequelize.query(
    `
    SELECT COUNT(DISTINCT(cr.student_studentnumber)) AS total, co.code, co.name FROM credit cr
    INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
    INNER JOIN course co ON cr.course_code = co.code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE cr.attainment_date BETWEEN :from AND :to
    AND cr.course_code IN (:programmeCourses)
    AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
    AND cr.credittypecode IN (4, 9)
    AND (se.code = :studyprogramme AND cr.attainment_date BETWEEN se.startdate AND se.enddate)
    GROUP BY co.id, co.code;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  // console.log('2: ', res.length)
  return res.map(course => ({
    code: course.code,
    name: course.name,
    year: course.year,
    totalOwn: parseInt(course.total),
  }))
}

const getOtherStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  // console.log('provider code: ', providerCode)
  // console.log('studyprogramme: ', studyprogramme)
  const res = await sequelize.query(
    `
    SELECT COUNT(DISTINCT(cr.student_studentnumber)) AS total, co.code, co.name FROM credit cr
    INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
    INNER JOIN course co ON cr.course_code = co.code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE cr.attainment_date BETWEEN :from AND :to
    AND cr.course_code IN (:programmeCourses)
    AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
    AND cr.credittypecode IN (4, 9)
    AND (se.code != :studyprogramme AND cr.attainment_date BETWEEN se.startdate AND se.enddate)
    GROUP BY co.id, co.code;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  // console.log('3: ', res.length)
  return res.map(course => ({
    code: course.code,
    name: course.name,
    year: course.year,
    totalOthers: parseInt(course.total),
  }))
}

const getStudentsWithoutStudyrightForProgrammeCourses = async (from, to, programmeCourses) => {
  const res = await sequelize.query(
    `
    SELECT COUNT(DISTINCT(cr.student_studentnumber)) AS total, co.code, co.name FROM credit cr
    INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
    INNER JOIN course co ON cr.course_code = co.code
    INNER JOIN course_providers cp ON cp.coursecode = co.id
    INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE cr.attainment_date BETWEEN :from AND :to
    AND cr.course_code IN (:programmeCourses)
    AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
    AND cr.credittypecode IN (4, 9)
    AND cr.student_studentnumber NOT IN
      (SELECT student_studentnumber FROM studyright
      WHERE studyright.student_studentnumber = cr.student_studentnumber
      AND cr.attainment_date BETWEEN studyright.startdate AND studyright.enddate)
    GROUP BY co.id, co.code;
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  // console.log('4: ', res.length)
  return res.map(course => ({
    code: course.code,
    name: course.name,
    year: course.year,
    totalWithout: parseInt(course.total),
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
}
