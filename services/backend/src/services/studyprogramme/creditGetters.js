const { Op } = require('sequelize')
const { Credit, Course, Organization } = require('../../models')
const { whereStudents } = require('.')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { formatCredit } = require('./studyprogrammeHelpers')

const getCreditsForStudyProgramme = async (provider, codes, since) =>
  (
    await sequelize.query(
      `
      SELECT 
        cr.id,
        cr.course_code, 
        cr.attainment_date, 
        cr.student_studentnumber, 
        cr.credits * COALESCE(share_element.share::numeric, 1) AS credits,
        cr.studyright_id
      FROM 
        credit cr
      JOIN 
        course_providers cp ON cr.course_id = cp.coursecode
      JOIN 
        organization o ON cp.organizationcode = o.id
      LEFT JOIN LATERAL 
        (
          SELECT (jae ->> 'share')::numeric AS share
          FROM jsonb_array_elements(cp.shares) AS jae
          WHERE (cr.attainment_date >= (jae ->> 'startDate')::date OR jae ->> 'startDate' IS NULL)
            AND (cr.attainment_date <= (jae ->> 'endDate')::date OR jae ->> 'endDate' IS NULL)
          ORDER BY 
            (jae ->> 'startDate')::date DESC NULLS LAST,
            (jae ->> 'endDate')::date DESC NULLS LAST
          LIMIT 1
        ) AS share_element ON TRUE
      WHERE 
        (o.code = :provider)
        AND cr.attainment_date >= :since
        AND cr.credittypecode = 4
        AND cr."isStudyModule" IS NOT TRUE
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { provider, codes, since },
      }
    )
  ).map(formatCredit)

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

module.exports = {
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
}
