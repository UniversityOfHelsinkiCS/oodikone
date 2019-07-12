module.exports = {
  up: async (queryInterface, Sequelize) => {
    // If you need old migrations, you can find them from 86b1aa1a3930a94f527bb5fe63ba0c76e5ca4d75
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.3
-- Dumped by pg_dump version 9.6.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET search_path = public, pg_catalog;

--
-- Name: enum_thesis_courses_thesisType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "enum_thesis_courses_thesisType" AS ENUM (
    'BACHELOR',
    'MASTER'
);


ALTER TYPE "enum_thesis_courses_thesisType" OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Sessions" (
    sid character varying(32) NOT NULL,
    expires timestamp with time zone,
    data text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE "Sessions" OWNER TO postgres;

--
-- Name: course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE course (
    code character varying(255) NOT NULL,
    name jsonb,
    latest_instance_date timestamp with time zone,
    is_study_module boolean,
    coursetypecode integer,
    startdate timestamp with time zone,
    enddate timestamp with time zone,
    max_attainment_date timestamp with time zone,
    min_attainment_date timestamp with time zone
);


ALTER TABLE course OWNER TO postgres;

--
-- Name: course_disciplines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE course_disciplines (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    discipline_id character varying(255) NOT NULL,
    course_id character varying(255) NOT NULL
);


ALTER TABLE course_disciplines OWNER TO postgres;

--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE course_enrollments (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    courserealisation_id character varying(255) NOT NULL,
    studentnumber character varying(255) NOT NULL
);


ALTER TABLE course_enrollments OWNER TO postgres;

--
-- Name: course_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE course_providers (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    coursecode character varying(255) NOT NULL,
    providercode character varying(255) NOT NULL
);


ALTER TABLE course_providers OWNER TO postgres;

--
-- Name: course_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE course_types (
    coursetypecode integer NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE course_types OWNER TO postgres;

--
-- Name: courserealisation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE courserealisation_types (
    realisationtypecode character varying(255) NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE courserealisation_types OWNER TO postgres;

--
-- Name: courserealisations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE courserealisations (
    courserealisation_id character varying(255) NOT NULL,
    name jsonb,
    startdate timestamp with time zone,
    enddate timestamp with time zone,
    parent character varying(255),
    root character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    realisationtypecode character varying(255),
    coursecode character varying(255)
);


ALTER TABLE courserealisations OWNER TO postgres;

--
-- Name: credit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE credit (
    id character varying(255) NOT NULL,
    grade character varying(255),
    student_studentnumber character varying(255),
    credits double precision,
    ordering character varying(255),
    createddate timestamp with time zone NOT NULL,
    lastmodifieddate timestamp with time zone NOT NULL,
    credittypecode integer,
    attainment_date timestamp with time zone,
    course_code character varying(255),
    semestercode integer NOT NULL,
    "isStudyModule" boolean
);


ALTER TABLE credit OWNER TO postgres;

--
-- Name: credit_teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE credit_teachers (
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    credit_id character varying(255) NOT NULL,
    teacher_id character varying(255) NOT NULL
);


ALTER TABLE credit_teachers OWNER TO postgres;

--
-- Name: credit_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE credit_types (
    credittypecode integer NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE credit_types OWNER TO postgres;

--
-- Name: disciplines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE disciplines (
    discipline_id character varying(255) NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE disciplines OWNER TO postgres;

--
-- Name: element_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE element_details (
    code character varying(255) NOT NULL,
    name jsonb,
    type integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE element_details OWNER TO postgres;

--
-- Name: error_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE error_data (
    id character varying(255) NOT NULL,
    data jsonb,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE error_data OWNER TO postgres;

--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE hibernate_sequence OWNER TO postgres;

--
-- Name: mandatory_course_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE mandatory_course_labels (
    studyprogramme_id character varying(255),
    id bigint NOT NULL,
    label character varying(255),
    "orderNumber" integer,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE mandatory_course_labels OWNER TO postgres;

--
-- Name: mandatory_course_labels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE mandatory_course_labels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE mandatory_course_labels_id_seq OWNER TO postgres;

--
-- Name: mandatory_course_labels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE mandatory_course_labels_id_seq OWNED BY mandatory_course_labels.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE migrations (
    name character varying(255) NOT NULL
);


ALTER TABLE migrations OWNER TO postgres;

--
-- Name: organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE organization (
    code character varying(255) NOT NULL,
    name jsonb
);


ALTER TABLE organization OWNER TO postgres;

--
-- Name: providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE providers (
    providercode character varying(255) NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE providers OWNER TO postgres;

--
-- Name: semester_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE semester_enrollments (
    id bigint NOT NULL,
    enrollmenttype integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    studentnumber character varying(255),
    semestercode integer,
    enrollment_date timestamp with time zone
);


ALTER TABLE semester_enrollments OWNER TO postgres;

--
-- Name: semester_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE semester_enrollments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE semester_enrollments_id_seq OWNER TO postgres;

--
-- Name: semester_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE semester_enrollments_id_seq OWNED BY semester_enrollments.id;


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE semesters (
    semestercode integer NOT NULL,
    name jsonb,
    startdate timestamp with time zone,
    enddate timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    yearcode integer,
    yearname character varying(255)
);


ALTER TABLE semesters OWNER TO postgres;

--
-- Name: sequence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE sequence (
    seq_name character varying(50) NOT NULL,
    seq_count numeric(38,0)
);


ALTER TABLE sequence OWNER TO postgres;

--
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE student (
    studentnumber character varying(255) NOT NULL,
    lastname character varying(255),
    firstnames character varying(255),
    abbreviatedname character varying(255),
    birthdate timestamp with time zone,
    communicationlanguage character varying(255),
    creditcount integer,
    dateofuniversityenrollment timestamp with time zone,
    matriculationexamination character varying(255),
    email character varying(255),
    phone character varying(255),
    city_fi character varying(255),
    city_sv character varying(255),
    national_student_number character varying(255),
    zipcode character varying(255),
    address character varying(255),
    address2 character varying(255),
    language_fi character varying(255),
    language_sv character varying(255),
    language_en character varying(255),
    age integer,
    mobile character varying(255),
    home_county_id integer,
    country_fi character varying(255),
    country_sv character varying(255),
    country_en character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    gender_code integer,
    gender_fi character varying(255),
    gender_sv character varying(255),
    gender_en character varying(255),
    home_country_en character varying(255),
    home_country_fi character varying(255),
    home_country_sv character varying(255)
);


ALTER TABLE student OWNER TO postgres;

--
-- Name: student_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE student_list (
    id integer NOT NULL,
    key character varying(255),
    max bigint,
    description character varying(255),
    student_numbers jsonb
);


ALTER TABLE student_list OWNER TO postgres;

--
-- Name: student_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE student_list_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE student_list_id_seq OWNER TO postgres;

--
-- Name: student_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE student_list_id_seq OWNED BY student_list.id;


--
-- Name: studyright; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE studyright (
    studyrightid bigint NOT NULL,
    canceldate timestamp with time zone,
    cancelorganisation character varying(255),
    enddate timestamp with time zone,
    givendate timestamp with time zone,
    graduated integer,
    highlevelname character varying(255),
    prioritycode integer,
    startdate timestamp with time zone,
    studystartdate timestamp with time zone,
    organization_code character varying(255),
    student_studentnumber character varying(255),
    extentcode integer
);


ALTER TABLE studyright OWNER TO postgres;

--
-- Name: studyright_elements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE studyright_elements (
    id integer NOT NULL,
    startdate timestamp with time zone,
    enddate timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    studyrightid bigint,
    code character varying(255),
    studentnumber character varying(255)
);


ALTER TABLE studyright_elements OWNER TO postgres;

--
-- Name: studyright_elements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE studyright_elements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE studyright_elements_id_seq OWNER TO postgres;

--
-- Name: studyright_elements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE studyright_elements_id_seq OWNED BY studyright_elements.id;


--
-- Name: studyright_extents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE studyright_extents (
    extentcode integer NOT NULL,
    name jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE studyright_extents OWNER TO postgres;

--
-- Name: teacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE teacher (
    id character varying(255) NOT NULL,
    code character varying(255),
    name character varying(255)
);


ALTER TABLE teacher OWNER TO postgres;

--
-- Name: transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE transfers (
    id integer NOT NULL,
    transferdate timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    studentnumber character varying(255),
    studyrightid bigint,
    sourcecode character varying(255),
    targetcode character varying(255)
);


ALTER TABLE transfers OWNER TO postgres;

--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE transfers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transfers_id_seq OWNER TO postgres;

--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE transfers_id_seq OWNED BY transfers.id;


--
-- Name: unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE unit (
    id bigint NOT NULL,
    name character varying(255),
    enabled boolean
);


ALTER TABLE unit OWNER TO postgres;

--
-- Name: unit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE unit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE unit_id_seq OWNER TO postgres;

--
-- Name: unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE unit_id_seq OWNED BY unit.id;


--
-- Name: mandatory_course_labels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mandatory_course_labels ALTER COLUMN id SET DEFAULT nextval('mandatory_course_labels_id_seq'::regclass);


--
-- Name: semester_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY semester_enrollments ALTER COLUMN id SET DEFAULT nextval('semester_enrollments_id_seq'::regclass);


--
-- Name: student_list id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY student_list ALTER COLUMN id SET DEFAULT nextval('student_list_id_seq'::regclass);


--
-- Name: studyright_elements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_elements ALTER COLUMN id SET DEFAULT nextval('studyright_elements_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers ALTER COLUMN id SET DEFAULT nextval('transfers_id_seq'::regclass);


--
-- Name: unit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit ALTER COLUMN id SET DEFAULT nextval('unit_id_seq'::regclass);


--
-- Name: Sessions Sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Sessions"
    ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY (sid);


--
-- Name: course_disciplines course_disciplines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_disciplines
    ADD CONSTRAINT course_disciplines_pkey PRIMARY KEY (discipline_id, course_id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (courserealisation_id, studentnumber);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_pkey PRIMARY KEY (code);


--
-- Name: course_providers course_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_providers
    ADD CONSTRAINT course_providers_pkey PRIMARY KEY (coursecode, providercode);


--
-- Name: course_types course_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_types
    ADD CONSTRAINT course_types_pkey PRIMARY KEY (coursetypecode);


--
-- Name: courserealisation_types courserealisation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY courserealisation_types
    ADD CONSTRAINT courserealisation_types_pkey PRIMARY KEY (realisationtypecode);


--
-- Name: courserealisations courserealisations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY courserealisations
    ADD CONSTRAINT courserealisations_pkey PRIMARY KEY (courserealisation_id);


--
-- Name: credit credit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit
    ADD CONSTRAINT credit_pkey PRIMARY KEY (id);


--
-- Name: credit_teachers credit_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_teachers
    ADD CONSTRAINT credit_teachers_pkey PRIMARY KEY (credit_id, teacher_id);


--
-- Name: credit_types credit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_types
    ADD CONSTRAINT credit_types_pkey PRIMARY KEY (credittypecode);


--
-- Name: disciplines disciplines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY disciplines
    ADD CONSTRAINT disciplines_pkey PRIMARY KEY (discipline_id);


--
-- Name: element_details element_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY element_details
    ADD CONSTRAINT element_details_pkey PRIMARY KEY (code);


--
-- Name: error_data error_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY error_data
    ADD CONSTRAINT error_data_pkey PRIMARY KEY (id);


--
-- Name: mandatory_course_labels mandatory_course_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY mandatory_course_labels
    ADD CONSTRAINT mandatory_course_labels_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (code);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (providercode);


--
-- Name: semester_enrollments semester_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY semester_enrollments
    ADD CONSTRAINT semester_enrollments_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (semestercode);


--
-- Name: sequence sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sequence
    ADD CONSTRAINT sequence_pkey PRIMARY KEY (seq_name);


--
-- Name: student_list student_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY student_list
    ADD CONSTRAINT student_list_pkey PRIMARY KEY (id);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY student
    ADD CONSTRAINT student_pkey PRIMARY KEY (studentnumber);


--
-- Name: studyright_elements studyright_elements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_elements
    ADD CONSTRAINT studyright_elements_pkey PRIMARY KEY (id);


--
-- Name: studyright_extents studyright_extents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_extents
    ADD CONSTRAINT studyright_extents_pkey PRIMARY KEY (extentcode);


--
-- Name: studyright studyright_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright
    ADD CONSTRAINT studyright_pkey PRIMARY KEY (studyrightid);


--
-- Name: teacher teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY teacher
    ADD CONSTRAINT teacher_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: unit unit_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit
    ADD CONSTRAINT unit_name_key UNIQUE (name);


--
-- Name: unit unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit
    ADD CONSTRAINT unit_pkey PRIMARY KEY (id);


--
-- Name: course_providers_providercode_coursecode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX course_providers_providercode_coursecode ON course_providers USING btree (providercode, coursecode);


--
-- Name: credit_attainment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_attainment_date ON credit USING btree (attainment_date);


--
-- Name: credit_course_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_course_code ON credit USING btree (course_code);


--
-- Name: credit_student_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_student_studentnumber ON credit USING btree (student_studentnumber);


--
-- Name: credit_teachers_credit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_teachers_credit_id ON credit_teachers USING btree (credit_id);


--
-- Name: credit_teachers_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_teachers_teacher_id ON credit_teachers USING btree (teacher_id);


--
-- Name: mandatory_course_labels_studyprogramme_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mandatory_course_labels_studyprogramme_id ON mandatory_course_labels USING btree (studyprogramme_id);


--
-- Name: semester_enrollment_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX semester_enrollment_studentnumber ON semester_enrollments USING btree (studentnumber);


--
-- Name: semester_enrollments_semestercode_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX semester_enrollments_semestercode_studentnumber ON semester_enrollments USING btree (semestercode, studentnumber);


--
-- Name: semester_enrollments_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX semester_enrollments_studentnumber ON semester_enrollments USING btree (studentnumber);


--
-- Name: studyright_elements_startdate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX studyright_elements_startdate ON studyright_elements USING btree (startdate);


--
-- Name: studyright_elements_startdate_enddate_studyrightid_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX studyright_elements_startdate_enddate_studyrightid_code ON studyright_elements USING btree (startdate, enddate, studyrightid, code);


--
-- Name: studyright_student_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX studyright_student_studentnumber ON studyright USING btree (student_studentnumber);


--
-- Name: transfers_studentnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transfers_studentnumber ON transfers USING btree (studentnumber);


--
-- Name: course course_coursetypecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course
    ADD CONSTRAINT course_coursetypecode_fkey FOREIGN KEY (coursetypecode) REFERENCES course_types(coursetypecode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: course_disciplines course_disciplines_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_disciplines
    ADD CONSTRAINT course_disciplines_course_id_fkey FOREIGN KEY (course_id) REFERENCES course(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_disciplines course_disciplines_discipline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_disciplines
    ADD CONSTRAINT course_disciplines_discipline_id_fkey FOREIGN KEY (discipline_id) REFERENCES disciplines(discipline_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_courserealisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_enrollments
    ADD CONSTRAINT course_enrollments_courserealisation_id_fkey FOREIGN KEY (courserealisation_id) REFERENCES courserealisations(courserealisation_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_enrollments
    ADD CONSTRAINT course_enrollments_studentnumber_fkey FOREIGN KEY (studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_providers course_providers_coursecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_providers
    ADD CONSTRAINT course_providers_coursecode_fkey FOREIGN KEY (coursecode) REFERENCES course(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_providers course_providers_providercode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY course_providers
    ADD CONSTRAINT course_providers_providercode_fkey FOREIGN KEY (providercode) REFERENCES providers(providercode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: courserealisations courserealisations_coursecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY courserealisations
    ADD CONSTRAINT courserealisations_coursecode_fkey FOREIGN KEY (coursecode) REFERENCES course(code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: courserealisations courserealisations_realisationtypecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY courserealisations
    ADD CONSTRAINT courserealisations_realisationtypecode_fkey FOREIGN KEY (realisationtypecode) REFERENCES courserealisation_types(realisationtypecode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: credit credit_course_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit
    ADD CONSTRAINT credit_course_code_fkey FOREIGN KEY (course_code) REFERENCES course(code);


--
-- Name: credit credit_credittypecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit
    ADD CONSTRAINT credit_credittypecode_fkey FOREIGN KEY (credittypecode) REFERENCES credit_types(credittypecode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: credit credit_semestercode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit
    ADD CONSTRAINT credit_semestercode_fkey FOREIGN KEY (semestercode) REFERENCES semesters(semestercode);


--
-- Name: credit credit_student_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit
    ADD CONSTRAINT credit_student_studentnumber_fkey FOREIGN KEY (student_studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE;


--
-- Name: credit_teachers credit_teachers_credit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_teachers
    ADD CONSTRAINT credit_teachers_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES credit(id);


--
-- Name: credit_teachers credit_teachers_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_teachers
    ADD CONSTRAINT credit_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teacher(id);


--
-- Name: semester_enrollments semester_enrollments_semestercode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY semester_enrollments
    ADD CONSTRAINT semester_enrollments_semestercode_fkey FOREIGN KEY (semestercode) REFERENCES semesters(semestercode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: semester_enrollments semester_enrollments_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY semester_enrollments
    ADD CONSTRAINT semester_enrollments_studentnumber_fkey FOREIGN KEY (studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: studyright_elements studyright_elements_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_elements
    ADD CONSTRAINT studyright_elements_code_fkey FOREIGN KEY (code) REFERENCES element_details(code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: studyright_elements studyright_elements_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_elements
    ADD CONSTRAINT studyright_elements_studentnumber_fkey FOREIGN KEY (studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: studyright_elements studyright_elements_studyrightid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright_elements
    ADD CONSTRAINT studyright_elements_studyrightid_fkey FOREIGN KEY (studyrightid) REFERENCES studyright(studyrightid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: studyright studyright_extentcode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright
    ADD CONSTRAINT studyright_extentcode_fkey FOREIGN KEY (extentcode) REFERENCES studyright_extents(extentcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: studyright studyright_student_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY studyright
    ADD CONSTRAINT studyright_student_studentnumber_fkey FOREIGN KEY (student_studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE;


--
-- Name: transfers transfers_sourcecode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_sourcecode_fkey FOREIGN KEY (sourcecode) REFERENCES element_details(code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_studentnumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_studentnumber_fkey FOREIGN KEY (studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_studyrightid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_studyrightid_fkey FOREIGN KEY (studyrightid) REFERENCES studyright(studyrightid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_targetcode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_targetcode_fkey FOREIGN KEY (targetcode) REFERENCES element_details(code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--
`, { transaction })
    })
  },
  down: async () => {
  }
}
