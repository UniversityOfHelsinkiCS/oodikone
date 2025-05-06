import { QueryTypes } from 'sequelize'

import { Name } from '@oodikone/shared/types'
import { dbConnections } from '../../database/connection'
import { ExtentCode } from '../../types'
import logger from '../../util/logger'

const { sequelize } = dbConnections

type QueryResult = {
  totalStudents: string
  totalCredits: number
  code: string
  courseName: Name
  isStudyModule: boolean
}

export const getStudentsForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: QueryResult[] = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT
          cr.student_studentnumber AS student,
          cr.credits AS credits,
          co.code AS code,
          co.name AS "courseName",
          cr."isStudyModule"
        FROM
          credit cr
        INNER JOIN
          course co
          ON cr.course_code = co.code
        WHERE
          cr.attainment_date BETWEEN :from AND :to
          AND cr.course_code IN (:programmeCourses)
          AND cr.credittypecode = 4
      )
      SELECT
        COUNT(student) AS "totalStudents",
        SUM(credits) AS "totalCredits",
        code,
        "courseName",
        "isStudyModule"
      FROM
        Dist
      GROUP BY
        dist.code,
        dist."courseName",
        dist."isStudyModule";
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { from, to, programmeCourses },
      }
    )
    return result.map(course => ({
      code: course.code,
      name: course.courseName,
      type: 'passed',
      isStudyModule: course.isStudyModule,
      totalPassed: parseInt(course.totalStudents, 10),
      totalAllCredits: course.totalCredits,
    }))
  } catch (error) {
    logger.error(`getStudentsForProgrammeCourses() function failed ${error}`)
    return []
  }
}

export const getOwnStudentsForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[],
  studyProgramme?: string
) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: QueryResult[] = await sequelize.query(
      `
    WITH Dist AS (
      SELECT DISTINCT
        cr.student_studentnumber AS student,
        cr.credits AS credits,
        co.code AS code,
        co.name AS "courseName",
        cr."isStudyModule"
      FROM
        credit cr
      INNER JOIN
        sis_study_rights sr
        ON sr.student_number = cr.student_studentnumber
      INNER JOIN
        sis_study_right_elements se
        ON se.study_right_id = sr.id
      INNER JOIN
        course co
        ON cr.course_code = co.code
      WHERE
        cr.attainment_date BETWEEN :from AND :to
        AND cr.course_code IN (:programmeCourses)
        AND cr.credittypecode = 4
        AND (
          se.code = :studyProgramme
          AND cr.attainment_date BETWEEN se.start_date AND se.end_date
        )
    )
    SELECT
      COUNT(student) AS "totalStudents",
      SUM(credits) AS "totalCredits",
      code,
      "courseName",
      "isStudyModule"
    FROM
      Dist
    GROUP BY
      dist.code,
      "courseName",
      "isStudyModule";
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { from, to, programmeCourses, studyProgramme },
      }
    )
    return result.map(course => ({
      code: course.code,
      name: course.courseName,
      type: 'ownProgramme',
      totalProgrammeStudents: parseInt(course.totalStudents, 10),
      totalProgrammeCredits: course.totalCredits,
    }))
  } catch (error) {
    logger.error(`getOwnStudentsForProgrammeCourses() function failed ${error}`)
    return []
  }
}

export const getOtherStudentsForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[],
  studyProgramme?: string
) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: QueryResult[] = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT
          cr.student_studentnumber AS student,
          cr.credits AS credits,
          co.code AS code,
          co.name AS "courseName",
          cr."isStudyModule"
        FROM
          credit cr
        INNER JOIN
          course co
          ON cr.course_code = co.code
        WHERE
          cr.attainment_date BETWEEN :from AND :to
          AND cr.course_code IN (:programmeCourses)
          AND cr.credittypecode = 4
          AND cr.student_studentnumber NOT IN (
            SELECT
              sr.student_number
            FROM
              sis_study_rights sr
            INNER JOIN
              sis_study_right_elements sre
              ON sre.study_right_id = sr.id
              AND sre.code = :studyProgramme
              AND cr.attainment_date BETWEEN sre.start_date AND sre.end_date
            WHERE
              sr.student_number = cr.student_studentnumber
          )
      )
      SELECT
        COUNT(student) AS "totalStudents",
        SUM(credits) AS "totalCredits",
        code,
        "courseName",
        "isStudyModule"
      FROM
        Dist
      GROUP BY
        dist.code,
        "courseName",
        "isStudyModule";
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { from, to, programmeCourses, studyProgramme },
      }
    )
    return result.map(course => ({
      code: course.code,
      name: course.courseName,
      type: 'otherProgramme',
      isStudyModule: course.isStudyModule,
      totalOtherProgrammeStudents: parseInt(course.totalStudents, 10),
      totalOtherProgrammeCredits: course.totalCredits,
    }))
  } catch (error) {
    logger.error(`getOtherStudentsForProgrammeCourses() function failed ${error}`)
    return []
  }
}

export const getTransferStudentsForProgrammeCourses = async (from: Date, to: Date, programmeCourses: string[]) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: QueryResult[] = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT
          cr.student_studentnumber AS student,
          cr.credits AS credits,
          co.code AS code,
          co.name AS "courseName",
          cr."isStudyModule"
        FROM
          credit cr
        INNER JOIN
          course co
          ON cr.course_code = co.code
        WHERE
          cr.attainment_date BETWEEN :from AND :to
          AND cr.course_code IN (:programmeCourses)
          AND cr.credittypecode = 9
      )
      SELECT
        COUNT(student) AS "totalStudents",
        SUM(credits) AS "totalCredits",
        code,
        "courseName",
        "isStudyModule"
      FROM
        Dist
      GROUP BY
        dist.code,
        "courseName",
        "isStudyModule";
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { from, to, programmeCourses },
      }
    )
    return result.map(course => ({
      code: course.code,
      name: course.courseName,
      type: 'transfer',
      isStudyModule: course.isStudyModule,
      totalTransferStudents: parseInt(course.totalStudents, 10),
      totalTransferCredits: course.totalCredits,
    }))
  } catch (error) {
    logger.error(`getTransferStudentsForProgrammeCourses() function failed ${error}`)
    return []
  }
}

export const getStudentsWithoutStudyRightForProgrammeCourses = async (
  from: Date,
  to: Date,
  programmeCourses: string[]
) => {
  if (!programmeCourses.length) {
    return []
  }
  try {
    const result: QueryResult[] = await sequelize.query(
      `
      WITH Dist AS (
        SELECT DISTINCT
          cr.student_studentnumber AS student,
          cr.credits AS credits,
          co.code AS code,
          co.name AS "courseName",
          cr."isStudyModule"
        FROM
          credit cr
        INNER JOIN
          course co
          ON cr.course_code = co.code
        LEFT JOIN
          sis_study_rights sr
          ON sr.student_number = cr.student_studentnumber
          AND sr.extent_code IN (:degreeExtentCodes)
          AND cr.attainment_date BETWEEN sr.start_date AND sr.end_date
        WHERE
          cr.attainment_date BETWEEN :from AND :to
          AND cr.course_code IN (:programmeCourses)
          AND cr.credittypecode = 4
          AND sr.student_number IS NULL
      )
      SELECT
        COUNT(student) AS "totalStudents",
        SUM(credits) AS "totalCredits",
        code,
        "courseName",
        "isStudyModule"
      FROM
        Dist
      GROUP BY
        dist.code,
        "courseName",
        "isStudyModule";
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
      name: course.courseName,
      type: 'noStudyright',
      totalWithoutStudyRightStudents: parseInt(course.totalStudents, 10),
      totalWithoutStudyRightCredits: course.totalCredits,
    }))
  } catch (error) {
    logger.error(`getStudentsWithoutStudyRightForProgrammeCourses() function failed ${error}`)
    return []
  }
}
