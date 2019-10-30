module.exports = {
    up: async queryInterface => {
      return queryInterface.sequelize.transaction(async transaction => {
        await queryInterface.sequelize.query(
            `
ALTER TABLE "usage_statistics"
ADD COLUMN "fixed_time" TIMESTAMP WITH TIME ZONE;

UPDATE "usage_statistics"
SET "fixed_time" = to_timestamp("time")::TIMESTAMP WITH TIME ZONE;

ALTER TABLE "usage_statistics"
ALTER COLUMN "time" TYPE TIMESTAMP WITH TIME ZONE
USING "fixed_time";

ALTER TABLE "usage_statistics"
DROP COLUMN "fixed_time";
            `,
          { transaction }
        )
      })
    },
    down: () => {}
  }
  