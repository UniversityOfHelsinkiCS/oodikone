module.exports = {
  up: async queryInterface => {
    // next_date_occurrence would previously return the same
    // date if now() was the same timestamp
    //
    // fix by checking with >= instead of >
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
  },
  down: async () => {},
}
