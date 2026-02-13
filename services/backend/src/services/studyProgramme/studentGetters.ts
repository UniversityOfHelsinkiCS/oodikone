import { QueryTypes } from 'sequelize'

import { CreditTypeCode, ExtentCode, Name } from '@oodikone/shared/types'
import { dbConnections } from '../../database/connection'
import logger from '../../util/logger'

// Categories here are as per Linjaukset.md in internal docs.
// Refer to them before making changes
const degreeExtentCodes = [ExtentCode.BACHELOR, ExtentCode.MASTER, ExtentCode.BACHELOR_AND_MASTER]

const exchangeStudentExtentCodes = [ExtentCode.EXCHANGE_STUDIES, ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE]

const otherUniversityExtentCodes = [ExtentCode.CONTRACT_TRAINING]

const separateStudyExtentCodes = [
  ExtentCode.NON_DEGREE_STUDIES,
  ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
  ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
  ExtentCode.SPECIALIZATION_STUDIES,
]

const otherExtentCodes = [
  ExtentCode.CONTINUING_EDUCATION,
  ExtentCode.DOCTOR,
  ExtentCode.LICENTIATE,
  ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY, // Includes veterinary
  ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS,
  ExtentCode.SUMMER_AND_WINTER_SCHOOL,
]

const openUniversityExtentCodes = [ExtentCode.OPEN_UNIVERSITY_STUDIES]

export type ProgrammeCourseCreditRow = {
  courseCode: string
  courseName: Name
  studentNumber: string
  attainmentDate: string
  credits: number

  variant: 'degree' | 'exchange' | 'separate' | 'otherUniversity' | 'other' | 'openUni' | 'none'

  isStudyModule: boolean
}

export type TransferCourseCreditRow = {
  courseCode: string
  courseName: Name
  studentNumber: string
  attainmentDate: string
  credits: number
  isStudyModule: boolean
}

const { sequelize } = dbConnections

export const getProgrammeCourseAggregates = async (params: {
  courseCodes: string[]
  from: Date
  to: Date
}): Promise<ProgrammeCourseCreditRow[]> => {
  const { courseCodes, from, to } = params

  if (courseCodes.length === 0) {
    return []
  }

  try {
    return await sequelize.query<ProgrammeCourseCreditRow>(
      `
        WITH filtered_credits AS (
          SELECT
            cr.course_code AS "courseCode",
            co.name AS "courseName",
            cr.student_studentnumber AS "studentNumber",
            cr.attainment_date AS "attainmentDate",
            cr.credits AS credits,
            cr."isStudyModule" AS "isStudyModule"
          FROM
            credit cr
            INNER JOIN course co ON co.code = cr.course_code
          WHERE
            cr.course_code IN (:courseCodes)
            AND cr.attainment_date BETWEEN :from AND :to
            AND cr.credittypecode = :creditType
        )
        SELECT
          fc."courseCode",
          fc."courseName",
          fc."studentNumber",
          fc."attainmentDate",
          fc.credits,
          fc."isStudyModule",
          CASE
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:degreeExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'degree'
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:exchangeStudentExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'exchange'
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:separateStudyExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'separate'
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:otherUniversityExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'otherUniversity'
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:otherExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'other'
            WHEN EXISTS (
              SELECT
                1
              FROM
                sis_study_rights sr
              WHERE
                sr.student_number = fc."studentNumber"
                AND sr.extent_code IN (:openUniversityExtentCodes)
                AND fc."attainmentDate" BETWEEN sr.start_date AND COALESCE(sr.end_date, 'infinity'::date)
            ) THEN 'openUni'
          ELSE 'none'
          END AS variant
        FROM
          filtered_credits fc
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          courseCodes,
          from,
          to,
          creditType: CreditTypeCode.PASSED,
          degreeExtentCodes,
          otherUniversityExtentCodes,
          separateStudyExtentCodes,
          exchangeStudentExtentCodes,
          openUniversityExtentCodes,
          otherExtentCodes,
        },
      }
    )
  } catch (error) {
    logger.error('getProgrammeCourseAggregates failed', { error })
    return []
  }
}

export const getTransferCourseAggregates = async (params: {
  courseCodes: string[]
  from: Date
  to: Date
}): Promise<TransferCourseCreditRow[]> => {
  const { courseCodes, from, to } = params

  if (courseCodes.length === 0) {
    return []
  }

  try {
    return await sequelize.query<TransferCourseCreditRow>(
      `
        SELECT
          cr.course_code AS "courseCode",
          co.name AS "courseName",
          cr.student_studentnumber AS "studentNumber",
          cr.attainment_date AS "attainmentDate",
          cr.credits AS credits,
          cr."isStudyModule" AS "isStudyModule"
        FROM
          credit cr
          INNER JOIN course co ON co.code = cr.course_code
        WHERE
          cr.course_code IN (:courseCodes)
          AND cr.attainment_date BETWEEN :from AND :to
          AND cr.credittypecode = :creditType
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          courseCodes,
          from,
          to,
          creditType: CreditTypeCode.APPROVED,
        },
      }
    )
  } catch (error) {
    logger.error('getTransferCourseAggregates failed', { error })
    return []
  }
}
