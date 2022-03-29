const { redisClient } = require('../../services/redis')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')

const getRedisCDS = async REDIS_KEY => {
  const raw = await redisClient.getAsync(REDIS_KEY)
  return raw && JSON.parse(raw)
}

const saveToRedis = async (data, REDIS_KEY, expire = false) => {
  await redisClient.setAsync(REDIS_KEY, JSON.stringify(data))
  if (expire) {
    // expire redis keys that are created daily after 24 hours
    redisClient.expireat(REDIS_KEY, parseInt(new Date().valueOf() / 1000) + 86400)
  }
}

const getTargetStudentCounts = async ({ codes, includeOldAttainments, excludeNonEnrolled }) => {
  return await sequelize.query(
    `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        ss.programme_type "programmeType",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
             public.is_in_target(
                 CURRENT_TIMESTAMP,
                 ss.studystartdate,
                 public.next_date_occurrence(ss.studystartdate), -- e.g if studystartdate = 2017-07-31 and it's now 2020-02-02, this returns 2020-07-31. However, if it's now 2020-11-01 (we've passed the date already), it returns 2021-07-31.
                 ss.credits,
                 CASE
                     -- HAX: instead of trying to guess which category the student is in if
                     --      the studyright is currently cancelled, just make the target HUGE
                     --      so we can subtract these from the non-goal students
                     WHEN ss.currently_cancelled = 1 THEN 999999999
                     -- credit target: 60 credits per year since starting
                     ELSE 60 * ceil(EXTRACT(EPOCH FROM (now() - ss.studystartdate) / 365) / 86400)
                 END
             )
        ) "students3y",
        SUM(
             public.is_in_target(
                 CURRENT_TIMESTAMP,
                 ss.studystartdate,
                 public.next_date_occurrence(ss.studystartdate),
                 ss.credits,
                 CASE
                     -- HAX: instead of trying to guess which category the student is in if
                     --      the studyright is currently cancelled, just make the target HUGE
                     --      so we can subtract these from the non-goal students
                     WHEN ss.currently_cancelled = 1 THEN 999999999
                     -- credit target: 45 credits per year since starting
                     ELSE 45 * ceil(EXTRACT(EPOCH FROM (now() - ss.studystartdate) / 365) / 86400)
                 END
             )
        ) "students4y",
        SUM(ss.currently_cancelled) "currentlyCancelled"
    FROM (
        SELECT
            org_code,
            org_name,
            programme_code,
            programme_name,
            programme_type,
            studystartdate,
            studentnumber,
            SUM(credits) credits,
            CASE
                WHEN SUM(currently_cancelled) > 0 THEN 1
                ELSE 0
            END currently_cancelled
        FROM (
            SELECT
                org.code org_code,
                org.name->>'fi' org_name,
                element_details.code programme_code,
                element_details.name->>'fi' programme_name,
                element_details.type programme_type,
                studyright.studystartdate studystartdate,
                studyright.student_studentnumber studentnumber,
                credit.credits credits,
                CASE
                    WHEN studyright.graduated = 0 AND (studyright.active = 0 OR studyright.enddate < NOW()) THEN 1
                    ELSE 0
                END currently_cancelled
            FROM
                organization org
                ${
                  excludeNonEnrolled
                    ? `
                -- only pick studyrights during which the student has enrolled at least once, whether it's
                -- a present or non-present enrollment
                INNER JOIN (
                  SELECT DISTINCT -- remove duplicate join rows from se with DISTINCT
                      studyright.*
                  FROM
                      studyright
                      INNER JOIN (
                          SELECT
                              studentnumber,
                              startdate
                          FROM
                              semester_enrollments
                              INNER JOIN semesters
                                  ON semester_enrollments.semestercode = semesters.semestercode
                      ) se
                          ON se.studentnumber = studyright.student_studentnumber
                  WHERE
                      se.startdate IS NOT NULL
                      AND se.startdate >= studyright.studystartdate
                ) studyright
                    ON org.code = studyright.faculty_code`
                    : `
                INNER JOIN studyright
                      ON org.code = studyright.faculty_code`
                }
                
                INNER JOIN (
                    -- HACK: fix updater writing duplicates where enddate has changed
                    SELECT DISTINCT ON (studyrightid, startdate, code, studentnumber)
                        *
                    FROM studyright_elements
                ) s_elements
                    ON studyright.studyrightid = s_elements.studyrightid
                INNER JOIN element_details
                    ON s_elements.code = element_details.code
                LEFT JOIN transfers
                    ON studyright.studyrightid = transfers.studyrightid
                LEFT JOIN LATERAL (
                    SELECT
                        student_studentnumber,
                        attainment_date,
                        credits
                    FROM credit
                    WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                        AND (credit."isStudyModule" = false OR credit."isStudyModule" IS NULL)
                        ${
                          includeOldAttainments
                            ? ''
                            : "AND credit.attainment_date >= studyright.studystartdate -- only include credits attained during studyright's time"
                        }
                ) credit
                    ON credit.student_studentnumber = studyright.student_studentnumber
            WHERE
                studyright.extentcode = 1 -- Bachelor's
                AND org.code NOT IN ('01', 'H02955')
                AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                AND studyright.studystartdate IN ('2017-08-01 00:00:00+00', '2018-08-01 00:00:00+00', '2019-08-01 00:00:00+00')
                AND element_details.type IN (20,30) -- programme
                ${!!codes && codes.length > 0 ? 'AND element_details.code IN (:codes)' : ''}
                AND transfers.studyrightid IS NULL -- Not transferred within faculty
        ) s
        GROUP BY (1,2), (3,4) ,5 , 6, 7
    ) ss
    GROUP BY (1, 2), (3, 4), 5;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        codes: codes,
      },
    }
  )
}

module.exports = {
  getRedisCDS,
  saveToRedis,
  getTargetStudentCounts,
}
