module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
-- Adminer 4.6.2 PostgreSQL dump

CREATE TABLE "public"."course_duplicates" (
    "groupid" integer NOT NULL,
    "coursecode" character varying(255) NOT NULL,
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    CONSTRAINT "course_duplicates_pkey" PRIMARY KEY ("coursecode")
) WITH (oids = false);


CREATE TYPE enum_thesis_courses_thesisType AS ENUM ('MASTER', 'BACHELOR');


CREATE TABLE "public"."thesis_courses" (
    "programmeCode" character varying(255) NOT NULL,
    "courseCode" character varying(255) NOT NULL,
    "thesisType" enum_thesis_courses_thesisType,
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    CONSTRAINT "thesis_courses_pkey" PRIMARY KEY ("programmeCode", "courseCode")
) WITH (oids = false);


-- 2019-07-01 15:28:04.971883+00

-- Adminer 4.6.2 PostgreSQL dump

CREATE SEQUENCE course_groups_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."course_groups" (
    "id" bigint DEFAULT nextval('course_groups_id_seq') NOT NULL,
    "name" character varying(255),
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    "programmeid" character varying(255),
    CONSTRAINT "course_groups_name_key" UNIQUE ("name"),
    CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


CREATE TABLE "public"."filters" (
    "id" character varying(255) NOT NULL,
    "name" character varying(255),
    "filters" jsonb,
    "population" jsonb,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL,
    "description" character varying(255) DEFAULT '',
    CONSTRAINT "filters_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


CREATE SEQUENCE mandatory_course_labels_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."mandatory_course_labels" (
    "studyprogramme_id" character varying(255),
    "id" bigint DEFAULT nextval('mandatory_course_labels_id_seq') NOT NULL,
    "label" character varying(255),
    "orderNumber" integer,
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    CONSTRAINT "mandatory_course_labels_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE INDEX "mandatory_course_labels_studyprogramme_id" ON "public"."mandatory_course_labels" USING btree ("studyprogramme_id");


CREATE SEQUENCE mandatory_courses_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."mandatory_courses" (
    "id" bigint DEFAULT nextval('mandatory_courses_id_seq') NOT NULL,
    "course_code" character varying(255),
    "studyprogramme_id" character varying(255),
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    "label" bigint,
    CONSTRAINT "mandatory_courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mandatory_courses_label_fkey" FOREIGN KEY (label) REFERENCES mandatory_course_labels(id) ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE
) WITH (oids = false);


CREATE SEQUENCE tag_tag_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."tag" (
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    "tagname" character varying(255),
    "studytrack" character varying(255) NOT NULL,
    "tag_id" bigint DEFAULT nextval('tag_tag_id_seq') NOT NULL,
    CONSTRAINT "tag_tag_id_key" UNIQUE ("tag_id")
) WITH (oids = false);


CREATE SEQUENCE tag_student_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."tag_student" (
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    "studentnumber" character varying(255),
    "id" bigint DEFAULT nextval('tag_student_id_seq') NOT NULL,
    "tag_id" bigint NOT NULL,
    CONSTRAINT "tag_student_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tag_student_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tag(tag_id) NOT DEFERRABLE
) WITH (oids = false);


CREATE SEQUENCE teacher_course_group_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE "public"."teacher_course_groups" (
    "id" bigint DEFAULT nextval('teacher_course_group_id_seq') NOT NULL,
    "teacher_id" character varying(255),
    "course_group_id" bigint,
    "createdAt" timestamptz,
    "updatedAt" timestamptz,
    CONSTRAINT "teacher_course_group_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


CREATE TABLE "public"."unit_tag" (
    "tags_tagname" character varying(255) NOT NULL,
    "unit_id" bigint NOT NULL,
    CONSTRAINT "unit_tag_pkey" PRIMARY KEY ("tags_tagname", "unit_id")
) WITH (oids = false);


-- 2019-07-01 15:26:14.147541+00
`)
  },
  down: async () => {
  }
}
