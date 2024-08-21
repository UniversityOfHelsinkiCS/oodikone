--
-- PostgreSQL database dump
--

-- Dumped from database version 15.7 (Debian 15.7-1.pgdg120+1)
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hibernate_sequence OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    name character varying(255) NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: sequence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sequence (
    seq_name character varying(50) NOT NULL,
    seq_count numeric(38,0)
);


ALTER TABLE public.sequence OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    full_name character varying(255),
    username character varying(255),
    language character varying(255) DEFAULT 'fi'::character varying,
    email character varying(255),
    sisu_person_id character varying(255),
    last_login timestamp with time zone,
    roles character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL,
    programme_rights character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (name) FROM stdin;
20190925_01_init_db_schema.js
20190925_02_populate_db.js
20191021_00_access_group_foreignkeys_and_primarykeys.js
20191021_01_remove_oodilearn_access_group.js
20200416_00_add_cooldata_access.js
20201019_00_add_coursestats_access.js
20210816_00_remove_faculty_access_group.js
20210817_00_remove_user_unit.js
20210818_00_add_new_special_programmes_to_faculties.js
20210823_00_add_moar_special_programmes.js
20210829_00_add_sisu_person_id.js
20210829_01_add_studyguidance_groups.js
20210831_00_remove_usage_and_coursegroups.js
20210910_00_remove_moar_access_groups.js
20210922_00_add_last_login.js
20211013_00_add_lisensiaatti_to_elainlaakis.js
20211020_00_drop_faculty_programmes.js
20211227_00_drop_affiliations.js
20220112_00_drop_hy_groups.js
20220712_00_add_iam_groups.js
20220831_00_add_facultystats_access.js
20221026_00_add_open_uni_dojo_access.js
20240523_00_add_roles_and_programme_rights_to_users.js
20240524_00_drop_user_faculties.js
20240524_01_drop_user_elementdetails.js
20240524_02_drop_user_accessgroup.js
20240524_03_drop_access_groups.js
20240524_04_remove_iam_groups_from_users.js
20240524_05_drop_sessions.js
\.


--
-- Data for Name: sequence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sequence (seq_name, seq_count) FROM stdin;
SEQ_GEN	2552900
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, username, language, email, sisu_person_id, last_login, roles, programme_rights) FROM stdin;
332	Matti Luukkainen	mluukkai	fi	grp-toska+mockmluukkai@helsinki.fi	hy-hlo-1441871	2024-07-10 09:07:34.586+00	{admin,courseStatistics,studyGuidanceGroups,facultyStatistics,teachers}	{}
\.


--
-- Name: hibernate_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hibernate_sequence', 1218233, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 698, true);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- Name: sequence sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sequence
    ADD CONSTRAINT sequence_pkey PRIMARY KEY (seq_name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_uk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_uk UNIQUE (username);


--
-- PostgreSQL database dump complete
--

