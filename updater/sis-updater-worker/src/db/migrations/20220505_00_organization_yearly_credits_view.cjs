module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW organization_yearly_credits AS (
        WITH organization_credits AS (
          SELECT
            org.code,
            studyright.studyrightid,
            credit.credits,
            credit.student_studentnumber,
            credit.attainment_date < studyright.studystartdate AS is_old
          FROM organization org
          JOIN studyright ON org.code = studyright.faculty_code
          JOIN credit ON credit.student_studentnumber = studyright.student_studentnumber
          WHERE credit.credittypecode IN (4, 9) AND
            (credit."isStudyModule" = false OR credit."isStudyModule" IS NULL)
        ), studyright_enrollment_exists AS (
          SELECT
            studyrightid,
            EXISTS (
              SELECT *
              FROM semester_enrollments se
              JOIN semesters s ON s.semestercode = se.semestercode
              WHERE se.studentnumber = studyright.student_studentnumber
            ) AS enrollment_exists
           FROM studyright
        )
        SELECT
            org.code org_code,
            org.name->>'fi' org_name,
            element_details.code programme_code,
            element_details.name->>'fi' programme_name,
            element_details.type programme_type,
            studyright.studystartdate studystartdate,
            studyright.student_studentnumber studentnumber,
            oc.credits credits,
            ses.enrollment_exists,
            oc.is_old,
            CASE
                WHEN studyright.graduated = 0 AND (studyright.active = 0 OR studyright.enddate < NOW()) THEN 1
                ELSE 0
            END currently_cancelled,
            DATE_PART('year', studyright.studystartdate) startyear
        FROM
            organization org
            INNER JOIN studyright ON org.code = studyright.faculty_code
            LEFT JOIN studyright_enrollment_exists ses ON ses.studyrightid = studyright.studyrightid
            INNER JOIN studyright_elements s_elements ON studyright.studyrightid = s_elements.studyrightid
            INNER JOIN element_details ON s_elements.code = element_details.code
            LEFT JOIN transfers ON studyright.studyrightid = transfers.studyrightid
            LEFT JOIN organization_credits oc ON oc.student_studentnumber = studyright.student_studentnumber AND oc.code = org.code AND studyright.studyrightid = oc.studyrightid
        WHERE
            studyright.extentcode = 1 -- Bachelor's
            AND org.code NOT IN ('01', 'H02955')
            AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
            AND DATE_PART('month', studyright.studystartdate) = 8 AND DATE_PART('day', studyright.studystartdate) = 1
            AND element_details.type IN (20,30) -- programme
            AND transfers.studyrightid IS NULL -- Not transferred within faculty
      )
    `)
  },
  down: async queryInterface => {
    await queryInterface.sequelize.query('DROP MATERIALIZED VIEW organization_yearly_credits')
  },
}
