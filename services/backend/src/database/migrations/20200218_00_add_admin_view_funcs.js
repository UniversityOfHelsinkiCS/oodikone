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
  },
  down: async () => {},
}
