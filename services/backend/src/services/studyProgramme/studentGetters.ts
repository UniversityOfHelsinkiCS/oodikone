import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { Credit, Semester, SemesterEnrollment, Student, Studyright, StudyrightElement } from '../../models'
import { CreditTypeCode } from '../../types/creditTypeCode'
import { EnrollmentType } from '../../types/enrollmentType'
import logger from '../../util/logger'
import { getCurrentSemester } from '../semesters'
import { formatStudent } from './format'

const { sequelize } = dbConnections

export const studytrackStudents = async (studentNumbers: string[]) =>
  (
    await Student.findAll({
      include: {
        model: Credit,
        separate: true,
        attributes: ['credits', 'attainment_date'],
        where: {
          isStudyModule: false,
          credittypecode: {
            [Op.in]: [CreditTypeCode.PASSED, CreditTypeCode.APPROVED],
          },
        },
      },
      where: {
        studentnumber: {
          [Op.in]: studentNumbers,
        },
      },
    })
  ).map(formatStudent)

export const enrolledStudents = async (studyTrack: string, studentNumbers: string[]) => {
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
              code: studyTrack,
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
          enrollmenttype: EnrollmentType.PRESENT,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })

  return students.filter(student => student.semester_enrollments?.length)
}
export const absentStudents = async (studyTrack: string, studentNumbers: string[]) => {
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
              code: studyTrack,
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
          enrollmenttype: EnrollmentType.ABSENT,
          semestercode: currentSemester.semestercode,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
  return students
}

export const getStudentsForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: Array<Record<string, any>> = await sequelize.query(
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
        type: QueryTypes.SELECT,
        replacements: { from, to, programmeCourses },
      }
    )
    return result.map(course => ({
      code: course.code,
      name: course.course_name,
      totalPassed: parseInt(course.total_students, 10),
      totalAllcredits: parseInt(course.total_credits, 10),
      type: 'passed',
      isStudyModule: course.isStudyModule,
    }))
  } catch (error) {
    logger.error(`getStudentsForProgrammeCourses() function failed ${error}`)
  }
}

export const getOwnStudentsForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[],
  studyprogramme: string
) => {
  if (!programmeCourses.length) {
    return []
  }
  const result: Array<Record<string, any>> = await sequelize.query(
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
      type: QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  return result.map(course => ({
    code: course.code,
    name: course.course_name,
    totalProgrammeStudents: parseInt(course.total_students, 10),
    totalProgrammeCredits: parseInt(course.total_credits, 10),
    type: 'ownProgramme',
  }))
}

export const getOtherStudentsForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[],
  studyprogramme: string
) => {
  if (!programmeCourses.length) {
    return []
  }
  const result: Array<Record<string, any>> = await sequelize.query(
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
      type: QueryTypes.SELECT,
      replacements: { from, to, programmeCourses, studyprogramme },
    }
  )
  return result.map(course => ({
    code: course.code,
    name: course.course_name,
    totalOtherProgrammeStudents: parseInt(course.total_students, 10),
    totalOtherProgrammeCredits: parseInt(course.total_credits, 10),
    type: 'otherProgramme',
    isStudyModule: course.isStudyModule,
  }))
}

export const getTransferStudentsForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  if (!programmeCourses.length) {
    return []
  }
  const result: Array<Record<string, any>> = await sequelize.query(
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
      type: QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return result.map(course => ({
    code: course.code,
    name: course.course_name,
    totalTransferStudents: parseInt(course.total_students, 10),
    totalTransferCredits: parseInt(course.total_credits, 10),
    isStudyModule: course.isStudyModule,
    type: 'transfer',
  }))
}

export const getStudentsWithoutStudyrightForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[]
) => {
  if (!programmeCourses.length) {
    return []
  }
  const result: Array<Record<string, any>> = await sequelize.query(
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
      type: QueryTypes.SELECT,
      replacements: { from, to, programmeCourses },
    }
  )
  return result.map(course => ({
    code: course.code,
    name: course.course_name,
    totalWithoutStudyrightStudents: parseInt(course.total_students, 10),
    totalWithoutStudyrightCredits: parseInt(course.total_credits, 10),
    type: 'noStudyright',
  }))
}
