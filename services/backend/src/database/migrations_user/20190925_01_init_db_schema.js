module.exports = {
  up: async queryInterface =>
    queryInterface.sequelize.query(
      `
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

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--



SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;


--
-- Name: access_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE access_groups (
    id bigint NOT NULL,
    group_code character varying(255),
    group_info character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: access_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE access_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: access_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE access_groups_id_seq OWNED BY access_groups.id;


--
-- Name: affiliations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE affiliations (
    id bigint NOT NULL,
    code character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: affiliations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE affiliations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: affiliations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE affiliations_id_seq OWNED BY affiliations.id;


--
-- Name: faculty_programmes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE faculty_programmes (
    faculty_code character varying(255) NOT NULL,
    programme_code character varying(255) NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: hy_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE hy_groups (
    id bigint NOT NULL,
    code character varying(255),
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: hy_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE hy_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: hy_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE hy_groups_id_seq OWNED BY hy_groups.id;


--
-- Name: sequence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE sequence (
    seq_name character varying(50) NOT NULL,
    seq_count numeric(38,0)
);



--
-- Name: user_accessgroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_accessgroup (
    id bigint NOT NULL,
    "userId" bigint,
    "accessGroupId" bigint,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: user_accessgroup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_accessgroup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: user_accessgroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_accessgroup_id_seq OWNED BY user_accessgroup.id;


--
-- Name: user_affiliation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_affiliation (
    id bigint NOT NULL,
    "userId" bigint,
    "affiliationId" bigint,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: user_affiliation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_affiliation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: user_affiliation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_affiliation_id_seq OWNED BY user_affiliation.id;


--
-- Name: user_elementdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_elementdetails (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" bigint NOT NULL,
    "elementDetailCode" character varying(255) NOT NULL
);



--
-- Name: user_faculties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_faculties (
    "userId" bigint NOT NULL,
    faculty_code character varying(255) NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: user_hy_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_hy_group (
    id bigint NOT NULL,
    "userId" bigint,
    "hyGroupId" bigint,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);



--
-- Name: user_hy_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_hy_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: user_hy_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_hy_group_id_seq OWNED BY user_hy_group.id;


--
-- Name: user_unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE user_unit (
    id bigint NOT NULL,
    user_id bigint,
    unit_id bigint
);



--
-- Name: user_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_unit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: user_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_unit_id_seq OWNED BY user_unit.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE users (
    id bigint NOT NULL,
    full_name character varying(255),
    username character varying(255),
    language character varying(255) DEFAULT 'fi'::character varying,
    email character varying(255)
);



--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: access_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY access_groups ALTER COLUMN id SET DEFAULT nextval('access_groups_id_seq'::regclass);


--
-- Name: affiliations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY affiliations ALTER COLUMN id SET DEFAULT nextval('affiliations_id_seq'::regclass);


--
-- Name: hy_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY hy_groups ALTER COLUMN id SET DEFAULT nextval('hy_groups_id_seq'::regclass);


--
-- Name: user_accessgroup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_accessgroup ALTER COLUMN id SET DEFAULT nextval('user_accessgroup_id_seq'::regclass);


--
-- Name: user_affiliation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_affiliation ALTER COLUMN id SET DEFAULT nextval('user_affiliation_id_seq'::regclass);


--
-- Name: user_hy_group id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_hy_group ALTER COLUMN id SET DEFAULT nextval('user_hy_group_id_seq'::regclass);


--
-- Name: user_unit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_unit ALTER COLUMN id SET DEFAULT nextval('user_unit_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: access_groups access_groups_group_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY access_groups
    ADD CONSTRAINT access_groups_group_code_key UNIQUE (group_code);


--
-- Name: access_groups access_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY access_groups
    ADD CONSTRAINT access_groups_pkey PRIMARY KEY (id);


--
-- Name: affiliations affiliations_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY affiliations
    ADD CONSTRAINT affiliations_code_key UNIQUE (code);


--
-- Name: affiliations affiliations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY affiliations
    ADD CONSTRAINT affiliations_pkey PRIMARY KEY (id);


--
-- Name: faculty_programmes faculty_programmes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY faculty_programmes
    ADD CONSTRAINT faculty_programmes_pkey PRIMARY KEY (faculty_code, programme_code);


--
-- Name: hy_groups hy_groups_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY hy_groups
    ADD CONSTRAINT hy_groups_code_key UNIQUE (code);


--
-- Name: hy_groups hy_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY hy_groups
    ADD CONSTRAINT hy_groups_pkey PRIMARY KEY (id);


--
-- Name: sequence sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sequence
    ADD CONSTRAINT sequence_pkey PRIMARY KEY (seq_name);


--
-- Name: user_accessgroup user_accessgroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_accessgroup
    ADD CONSTRAINT user_accessgroup_pkey PRIMARY KEY (id);


--
-- Name: user_affiliation user_affiliation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_affiliation
    ADD CONSTRAINT user_affiliation_pkey PRIMARY KEY (id);


--
-- Name: user_elementdetails user_elementdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_elementdetails
    ADD CONSTRAINT user_elementdetails_pkey PRIMARY KEY ("userId", "elementDetailCode");


--
-- Name: user_faculties user_faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_faculties
    ADD CONSTRAINT user_faculties_pkey PRIMARY KEY ("userId", faculty_code);


--
-- Name: user_hy_group user_hy_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_hy_group
    ADD CONSTRAINT user_hy_group_pkey PRIMARY KEY (id);


--
-- Name: user_unit user_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_unit
    ADD CONSTRAINT user_unit_pkey PRIMARY KEY (id);


--
-- Name: user_unit user_unit_user_id_unit_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_unit
    ADD CONSTRAINT user_unit_user_id_unit_id_key UNIQUE (user_id, unit_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_uk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_uk UNIQUE (username);


--
-- Name: user_accessgroup user_accessgroup_accessGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_accessgroup
    ADD CONSTRAINT "user_accessgroup_accessGroupId_fkey" FOREIGN KEY ("accessGroupId") REFERENCES access_groups(id);


--
-- Name: user_accessgroup user_accessgroup_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_accessgroup
    ADD CONSTRAINT "user_accessgroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: user_affiliation user_affiliation_affiliationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_affiliation
    ADD CONSTRAINT "user_affiliation_affiliationId_fkey" FOREIGN KEY ("affiliationId") REFERENCES affiliations(id);


--
-- Name: user_affiliation user_affiliation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_affiliation
    ADD CONSTRAINT "user_affiliation_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: user_elementdetails user_elementdetails_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_elementdetails
    ADD CONSTRAINT "user_elementdetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_faculties user_faculties_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_faculties
    ADD CONSTRAINT "user_faculties_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: user_hy_group user_hy_group_hyGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_hy_group
    ADD CONSTRAINT "user_hy_group_hyGroupId_fkey" FOREIGN KEY ("hyGroupId") REFERENCES hy_groups(id);


--
-- Name: user_hy_group user_hy_group_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_hy_group
    ADD CONSTRAINT "user_hy_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: user_unit user_unit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY user_unit
    ADD CONSTRAINT user_unit_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
`
    ),
  down: async () => {},
}
