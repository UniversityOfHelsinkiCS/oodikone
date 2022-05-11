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

const getTargetStudentCounts = async ({
  codes,
  includeOldAttainments,
  excludeNonEnrolled,
  startYear = 2017,
  endYear = 2020,
}) => {
  // only pick studyrights during which the student has enrolled at least once, whether it's
  // a present or non-present enrollment

  return await sequelize.query(
    `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        ss.programme_type "programmeType",
        0 AS "students3y",
        COUNT(ss.studentnumber) FILTER (
          WHERE
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
            ) = 1
        ) "students3y",
        COUNT(ss.studentnumber) FILTER (
          WHERE
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
            ) = 1
        ) "students4y",
        COUNT(ss.studentnumber) "programmeTotalStudents",
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
            SUM(credits) FILTER (WHERE NOT credits.is_old OR :include_old_attainments) credits,
            CASE
                WHEN SUM(currently_cancelled) > 0 THEN 1
                ELSE 0
            END currently_cancelled
        FROM organization_yearly_credits credits
        WHERE
          (NOT :exclude_non_enrolled OR credits.enrollment_exists) AND
          (:ignore_codes OR credits.programme_code IN (:codes)) AND
          credits.startyear BETWEEN :start_year AND :end_year
        GROUP BY (1,2), (3,4) ,5 , 6, 7
    ) ss
    GROUP BY (1, 2), (3, 4), 5;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        codes: !codes || codes.length === 0 ? ['DUMMY'] : codes,
        ignore_codes: !codes || codes.length === 0,
        exclude_non_enrolled: excludeNonEnrolled,
        start_year: startYear,
        end_year: endYear,
        include_old_attainments: includeOldAttainments,
      },
    }
  )
}

module.exports = {
  getRedisCDS,
  saveToRedis,
  getTargetStudentCounts,
}
