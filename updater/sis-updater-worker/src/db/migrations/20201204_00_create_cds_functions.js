module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION public.map_range(
        input DOUBLE PRECISION,
        inMin DOUBLE PRECISION,
        inMax DOUBLE PRECISION,
        outMin DOUBLE PRECISION,
        outMax DOUBLE PRECISION)
    RETURNS DOUBLE PRECISION AS $$
        SELECT (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    $$ LANGUAGE SQL;
    
    CREATE OR REPLACE FUNCTION public.is_in_target(
        currentDate TIMESTAMP WITH TIME ZONE,
        studyStartDate TIMESTAMP WITH TIME ZONE,
        targetDate TIMESTAMP WITH TIME ZONE,
        studentCredits DOUBLE PRECISION,
        targetCredits DOUBLE PRECISION)
    RETURNS INTEGER AS $$
        SELECT CASE WHEN studentCredits >= public.map_range(
            EXTRACT(EPOCH FROM currentDate),
            EXTRACT(EPOCH FROM studyStartDate),
            EXTRACT(EPOCH FROM targetDate),
            0,
            targetCredits
        )
            THEN 1
            ELSE 0
        END;
    $$ LANGUAGE SQL;`,
      {
        multipleStatements: true,
      }
    )

    await queryInterface.sequelize.query(
      `
      CREATE OR REPLACE FUNCTION public.map_range(
          input DOUBLE PRECISION,
          inMin DOUBLE PRECISION,
          inMax DOUBLE PRECISION,
          outMin DOUBLE PRECISION,
          outMax DOUBLE PRECISION)
      RETURNS DOUBLE PRECISION AS $$
          SELECT (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
      $$ LANGUAGE SQL IMMUTABLE;

      CREATE OR REPLACE FUNCTION public.is_in_target(
          currentDate TIMESTAMP WITH TIME ZONE,
          studyStartDate TIMESTAMP WITH TIME ZONE,
          targetDate TIMESTAMP WITH TIME ZONE,
          studentCredits DOUBLE PRECISION,
          targetCredits DOUBLE PRECISION)
      RETURNS INTEGER AS $$
          SELECT CASE WHEN studentCredits >= public.map_range(
              EXTRACT(EPOCH FROM currentDate),
              EXTRACT(EPOCH FROM studyStartDate),
              EXTRACT(EPOCH FROM targetDate),
              0,
              targetCredits
          )
              THEN 1
              ELSE 0
          END;
      $$ LANGUAGE SQL STABLE;
      `,
      {
        multipleStatements: true,
      }
    )

    // new funcs
    await queryInterface.sequelize.query(
      `
      CREATE OR REPLACE FUNCTION change_year(t timestamp with time zone, yr int) RETURNS timestamp with time zone AS $$
          SELECT make_timestamptz(
              yr,
              date_part('month', t)::int,
              date_part('day', t)::int,
              date_part('hour', t)::int,
              date_part('minute', t)::int,
              date_part('second', t)
          )
      $$ LANGUAGE SQL STABLE;

      CREATE OR REPLACE FUNCTION is_leap_day(t timestamp with time zone) RETURNS boolean AS $$
          SELECT date_part('day', t) = 29 AND date_part('month', t) = 2
      $$ LANGUAGE SQL STABLE;

      CREATE OR REPLACE FUNCTION same_date_this_year(t timestamp with time zone) RETURNS timestamp with time zone AS $$
          SELECT
              CASE
                  WHEN public.is_leap_day(t) THEN public.change_year(t + INTERVAL '1 day', date_part('year', CURRENT_TIMESTAMP)::int)
                  ELSE public.change_year(t, date_part('year', CURRENT_TIMESTAMP)::int)
              END
      $$ LANGUAGE SQL STABLE;

      CREATE OR REPLACE FUNCTION next_date_occurrence(t timestamp with time zone) RETURNS timestamp with time zone AS $$
          SELECT
              CASE
                  WHEN CURRENT_TIMESTAMP > public.same_date_this_year(t) THEN public.same_date_this_year(t) + INTERVAL '1 year'
                  ELSE public.same_date_this_year(t)
              END
      $$ LANGUAGE SQL STABLE;
      `,
      {
        multipleStatements: true,
      }
    )

    await queryInterface.sequelize.query(
      `
      CREATE OR REPLACE FUNCTION next_date_occurrence(t timestamp with time zone) RETURNS timestamp with time zone AS $$
          SELECT
              CASE
                  WHEN CURRENT_TIMESTAMP >= public.same_date_this_year(t)
                      THEN public.same_date_this_year(t) + INTERVAL '1 year'
                  ELSE public.same_date_this_year(t)
              END
      $$ LANGUAGE SQL STABLE;
      `,
      {
        multipleStatements: true,
      }
    )

    await queryInterface.sequelize.query(
      `
      CREATE OR REPLACE FUNCTION same_date_this_year(
          t timestamp with time zone,
          reference_date timestamp with time zone
      ) RETURNS timestamp with time zone AS $$
          SELECT
              CASE
                  WHEN public.is_leap_day(t) THEN public.change_year(t + INTERVAL '1 day', date_part('year', reference_date)::int)
                  ELSE public.change_year(t, date_part('year', reference_date)::int)
              END
      $$ LANGUAGE SQL STABLE;
      
      CREATE OR REPLACE FUNCTION next_date_occurrence(
          t timestamp with time zone,
          reference_date timestamp with time zone
      ) RETURNS timestamp with time zone AS $$
          SELECT
              CASE
                  WHEN reference_date >= public.same_date_this_year(t, reference_date)
                      THEN public.same_date_this_year(t, reference_date) + INTERVAL '1 year'
                  ELSE public.same_date_this_year(t, reference_date)
              END
      $$ LANGUAGE SQL STABLE;
      `,
      {
        multipleStatements: true,
      }
    )
  },
  down: async () => {},
}
