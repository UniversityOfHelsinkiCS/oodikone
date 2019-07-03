module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
-- Adminer 4.6.2 PostgreSQL dump

CREATE TABLE IF NOT EXISTS "public"."usage_statistics" (
    "id" character varying(255) NOT NULL,
    "username" character varying(255),
    "name" character varying(255),
    "time" integer,
    "admin" boolean,
    "method" character varying(255),
    "URL" character varying(255),
    "status" integer,
    "data" jsonb,
    CONSTRAINT "usage_statistics_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


-- 2019-07-03 15:39:09.675736+00
`)
  },
  down: async () => {
  }
}
