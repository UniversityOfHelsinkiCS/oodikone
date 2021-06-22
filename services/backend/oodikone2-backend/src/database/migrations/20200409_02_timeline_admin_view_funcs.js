module.exports = {
  up: async queryInterface => {
    // adds overloads for a couple of functions from 20200409_00_more_admin_view_funcs.js
    // where the CURRENT_TIMESTAMP can be passed via argument
    // for use in the cool-data-science timeline calculations
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
        multipleStatements: true
      }
    )
  },
  down: async () => {}
}
