const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const logger = require('../../util/logger')
const { Op } = require('sequelize')
const { Student, Credit, Studyright, StudyrightElement, SemesterEnrollment, Semester } = require('../../models')
const { getCurrentSemester } = require('../semesters')
const { formatStudent } = require('./studyprogrammeHelpers')

const studytrackStudents = async studentnumbers =>
  (
    await Student.findAll({
      include: {
        model: Credit,
        separate: true,
        attributes: ['credits', 'attainment_date'],
        where: {
          isStudyModule: false,
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

const enrolledStudents = async (studytrack, studentnumbers) => {
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
        where: {
          graduated: 0,
          active: 1,
        },
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode', 'enrollmenttype'],
        include: [
          {
            model: Semester,
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
        where: {
          graduated: 0,
          active: 1,
        },
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
const getStudentsForProgrammeCourses = async (from, to, programmeCourses) => {
  if (!programmeCourses.length) return []
  try {
    const res = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits, 
         co.code AS code, co.name AS course_name, cr."isStudyModule" FROM credit cr
         INNER JOIN course co ON cr.course_code = co.code
         WHERE cr.attainment_date BETWEEN :from AND :to
         AND cr.course_code IN (:programmeCourses)
         AND cr.credittypecode = 4
         )
         SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
         FROM Dist
         GROUP BY dist.code, dist.course_name, dist."isStudyModule";
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { from, to, programmeCourses },
      }
    )
    const result = res.map(course => ({
      code: course.code,
      name: course.course_name,
      totalPassed: parseInt(course.total_students, 10),
      totalAllcredits: parseInt(course.total_credits, 10),
      type: 'passed',
      isStudyModule: course.isStudyModule,
    }))
    return result
  } catch (e) {
    logger.error(`getStudentsForProgrammeCourses() function failed ${e}`)
  }
}

const getOwnStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  if (!programmeCourses.length) return []
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
        co.code AS code, co.name AS course_name, cr."isStudyModule" FROM credit cr
        INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
        INNER JOIN course co ON cr.course_code = co.code
        INNER JOIN course_providers cp ON cp.coursecode = co.id
        INNER JOIN organization o ON o.id = cp.organizationcode
        WHERE cr.attainment_date BETWEEN :from AND :to
        AND cr.course_code IN (:programmeCourses)
        AND cr.credittypecode = 4
        AND (se.code = :studyprogramme AND cr.attainment_date BETWEEN se.startdate AND se.enddate)
    )
     SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
       FROM Dist
       GROUP BY dist.code, course_name, "isStudyModule";
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
      totalProgrammeStudents: parseInt(course.total_students, 10),
      totalProgrammeCredits: parseInt(course.total_credits, 10),
      type: 'ownProgramme',
    }
    return res
  })
}

const getOtherStudentsForProgrammeCourses = async (from, to, programmeCourses, studyprogramme) => {
  if (!programmeCourses.length) return []
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name, cr."isStudyModule" FROM credit cr
      INNER JOIN studyright_elements se ON se.studentnumber = cr.student_studentnumber
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
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
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
      FROM Dist
      GROUP BY dist.code, course_name, "isStudyModule";
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalOtherProgrammeStudents: parseInt(course.total_students, 10),
    totalOtherProgrammeCredits: parseInt(course.total_credits, 10),
    type: 'otherProgramme',
    isStudyModule: course.isStudyModule,
  }))
}

const getTransferStudentsForProgrammeCourses = async (from, to, programmeCourses) => {
  if (!programmeCourses.length) return []
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name, cr."isStudyModule" FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 9
      )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
      FROM Dist
      GROUP BY dist.code, course_name, "isStudyModule";
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalTransferStudents: parseInt(course.total_students, 10),
    totalTransferCredits: parseInt(course.total_credits, 10),
    isStudyModule: course.isStudyModule,
    type: 'transfer',
  }))
}

const getStudentsWithoutStudyrightForProgrammeCourses = async (from, to, programmeCourses) => {
  if (!programmeCourses.length) return []
  const res = await sequelize.query(
    `
    WITH Dist AS (
      SELECT DISTINCT cr.student_studentnumber AS student, cr.credits AS credits,
      co.code AS code, co.name AS course_name, cr."isStudyModule" FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 4
      AND cr.student_studentnumber NOT IN
        (
        SELECT student_studentnumber FROM studyright_elements
        WHERE studyright_elements.studentnumber = cr.student_studentnumber
        AND cr.attainment_date BETWEEN studyright_elements.startdate AND studyright_elements.enddate)
      )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
      FROM Dist
      GROUP BY dist.code, course_name, "isStudyModule";
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return res.map(course => ({
    code: course.code,
    name: course.course_name,
    totalWithoutStudyrightStudents: parseInt(course.total_students, 10),
    totalWithoutStudyrightCredits: parseInt(course.total_credits, 10),
    type: 'noStudyright',
  }))
}

module.exports = {
  getStudentsForProgrammeCourses,
  getOwnStudentsForProgrammeCourses,
  getStudentsWithoutStudyrightForProgrammeCourses,
  getOtherStudentsForProgrammeCourses,
  getTransferStudentsForProgrammeCourses,
  studytrackStudents,
  enrolledStudents,
  absentStudents,
}
