import { QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { ExtentCode } from '../../types'
import logger from '../../util/logger'

const { sequelize } = dbConnections

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
        INNER JOIN sis_study_rights sr ON sr.student_number = cr.student_studentnumber
        INNER JOIN sis_study_right_elements se ON se.study_right_id = sr.id
        INNER JOIN course co ON cr.course_code = co.code
        INNER JOIN course_providers cp ON cp.coursecode = co.id
        INNER JOIN organization o ON o.id = cp.organizationcode
        WHERE cr.attainment_date BETWEEN :from AND :to
        AND cr.course_code IN (:programmeCourses)
        AND cr.credittypecode = 4
        AND (se.code = :studyprogramme AND cr.attainment_date BETWEEN se.start_date AND se.end_date)
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
      INNER JOIN course co ON cr.course_code = co.code
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 4
      AND cr.student_studentnumber NOT IN (
        SELECT student_number FROM sis_study_rights sr
        INNER JOIN sis_study_right_elements sre ON sre.study_right_id = sr.id AND sre.code = :studyprogramme AND cr.attainment_date BETWEEN sre.start_date AND sre.end_date
        WHERE sr.student_number = cr.student_studentnumber
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
      LEFT JOIN sis_study_rights sr ON sr.student_number = cr.student_studentnumber AND sr.extent_code IN (:degreeExtentCodes) AND cr.attainment_date BETWEEN sr.start_date AND sr.end_date
      WHERE cr.attainment_date BETWEEN :from AND :to
      AND cr.course_code IN (:programmeCourses)
      AND cr.credittypecode = 4
      AND sr.student_number IS NULL
    )
      SELECT COUNT(student) AS total_students, SUM(credits) AS total_credits, code, course_name, "isStudyModule"
      FROM Dist
      GROUP BY dist.code, course_name, "isStudyModule";
      `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        from,
        to,
        programmeCourses,
        degreeExtentCodes: [
          ExtentCode.BACHELOR,
          ExtentCode.MASTER,
          ExtentCode.BACHELOR_AND_MASTER,
          ExtentCode.DOCTOR,
          ExtentCode.LICENTIATE,
          ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
        ],
      },
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
