module.exports = {
  up: async ({ context: queryInterface }) =>
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

SET search_path = public, pg_catalog;

--
-- Data for Name: access_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO access_groups VALUES (1, 'teachers', 'grants access to teacher statistics', '2019-02-18 09:07:49.816+00', '2019-02-18 09:07:49.816+00');
INSERT INTO access_groups VALUES (2, 'admin', 'grants access to everything', '2019-02-18 09:07:49.816+00', '2019-02-18 09:07:49.816+00');
INSERT INTO access_groups VALUES (3, 'users', 'grants access to users management', '2019-02-18 09:07:49.934+00', '2019-02-18 09:07:49.934+00');
INSERT INTO access_groups VALUES (4, 'usage', 'grants access to usage statistics', '2019-02-18 09:07:49.934+00', '2019-02-18 09:07:49.934+00');
INSERT INTO access_groups VALUES (5, 'oodilearn', 'grants access to oodilearn statistics', '2019-02-18 09:07:49.934+00', '2019-02-18 09:07:49.934+00');
INSERT INTO access_groups VALUES (6, 'coursegroups', 'grants access to course groups', '2019-02-18 09:07:49.934+00', '2019-02-18 09:07:49.934+00');
INSERT INTO access_groups VALUES (7, 'studyprogramme', 'grants access to studyprogramme page', '2019-02-18 09:07:50.003+00', '2019-02-18 09:07:50.003+00');
INSERT INTO access_groups VALUES (8, 'dev', 'grants access to developer UI', '2019-02-26 14:13:14.255+00', '2019-02-26 14:13:14.255+00');
INSERT INTO access_groups VALUES (10, 'faculties', 'grants access to faculty statistics', '2019-09-11 13:22:35.573+00', '2019-09-11 13:22:35.573+00');


--
-- Name: access_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('access_groups_id_seq', 10, true);


--
-- Data for Name: affiliations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO affiliations VALUES (1, 'student', '2019-03-04 13:39:32.921+00', '2019-03-04 13:39:32.921+00');
INSERT INTO affiliations VALUES (2, 'member', '2019-03-04 13:39:32.921+00', '2019-03-04 13:39:32.921+00');
INSERT INTO affiliations VALUES (3, 'staff', '2019-03-04 13:39:32.921+00', '2019-03-04 13:39:32.921+00');
INSERT INTO affiliations VALUES (4, 'employee', '2019-03-04 13:39:32.922+00', '2019-03-04 13:39:32.922+00');
INSERT INTO affiliations VALUES (5, 'faculty', '2019-03-05 12:30:27.632+00', '2019-03-05 12:30:27.632+00');
INSERT INTO affiliations VALUES (6, 'affiliate', '2019-05-29 08:16:04.225+00', '2019-05-29 08:16:04.225+00');


--
-- Name: affiliations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('affiliations_id_seq', 6, true);


--
-- Data for Name: faculty_programmes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO faculty_programmes VALUES ('H10', 'MH10_001', '2019-06-26 15:10:16.37+00', '2019-06-26 15:10:16.37+00');
INSERT INTO faculty_programmes VALUES ('H10', 'MH40_011', '2019-06-26 15:10:16.37+00', '2019-06-26 15:10:16.37+00');
INSERT INTO faculty_programmes VALUES ('H10', 'KH10_001', '2019-06-26 15:10:16.37+00', '2019-06-26 15:10:16.37+00');
INSERT INTO faculty_programmes VALUES ('H20', 'KH20_001', '2019-06-26 15:10:16.483+00', '2019-06-26 15:10:16.483+00');
INSERT INTO faculty_programmes VALUES ('H20', 'MH20_001', '2019-06-26 15:10:16.483+00', '2019-06-26 15:10:16.483+00');
INSERT INTO faculty_programmes VALUES ('H20', 'MH20_002', '2019-06-26 15:10:16.483+00', '2019-06-26 15:10:16.483+00');
INSERT INTO faculty_programmes VALUES ('H30', 'KH30_001', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'KH30_002', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'MH30_002', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'MH30_003', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'MH30_004', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'MH30_005', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H30', 'MH30_001', '2019-06-26 15:10:16.529+00', '2019-06-26 15:10:16.529+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_001', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_002', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_003', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_004', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_005', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'KH40_006', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_001', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_002', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_003', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_004', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_005', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_006', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_007', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_008', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_009', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_010', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_011', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_012', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_013', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_014', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH40_015', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH70_001', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H40', 'MH70_006', '2019-06-26 15:10:16.587+00', '2019-06-26 15:10:16.587+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_001', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_002', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_003', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_004', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_005', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_006', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'KH50_007', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_001', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_002', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_003', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_004', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_005', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_006', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_007', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_008', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_009', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_010', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_011', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_012', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H50', 'MH50_013', '2019-06-26 15:10:16.701+00', '2019-06-26 15:10:16.701+00');
INSERT INTO faculty_programmes VALUES ('H55', 'KH55_001', '2019-06-26 15:10:16.764+00', '2019-06-26 15:10:16.764+00');
INSERT INTO faculty_programmes VALUES ('H55', 'MH55_001', '2019-06-26 15:10:16.764+00', '2019-06-26 15:10:16.764+00');
INSERT INTO faculty_programmes VALUES ('H57', 'KH57_001', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'KH57_002', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'KH57_003', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH50_002', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH50_013', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH57_001', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH57_002', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH57_003', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH57_004', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH57_005', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H57', 'MH80_007', '2019-06-26 15:10:16.793+00', '2019-06-26 15:10:16.793+00');
INSERT INTO faculty_programmes VALUES ('H60', 'KH60_001', '2019-06-26 15:10:16.843+00', '2019-06-26 15:10:16.843+00');
INSERT INTO faculty_programmes VALUES ('H60', 'MH60_001', '2019-06-26 15:10:16.843+00', '2019-06-26 15:10:16.843+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH40_001', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH50_001', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH70_001', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH70_002', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH70_003', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'KH70_004', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH50_001', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH57_005', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_001', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_002', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_003', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_004', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_005', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_006', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_007', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_008', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_009', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H70', 'MH70_010', '2019-06-26 15:10:16.864+00', '2019-06-26 15:10:16.864+00');
INSERT INTO faculty_programmes VALUES ('H74', 'KH74_001', '2019-06-26 15:10:16.908+00', '2019-06-26 15:10:16.908+00');
INSERT INTO faculty_programmes VALUES ('H80', 'KH57_002', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'KH80_001', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'KH80_002', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'KH80_003', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'KH80_004', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH57_002', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH57_003', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH57_005', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_001', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_002', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_003', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_004', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_005', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_006', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H80', 'MH80_007', '2019-06-26 15:10:16.911+00', '2019-06-26 15:10:16.911+00');
INSERT INTO faculty_programmes VALUES ('H90', 'KH90_001', '2019-06-26 15:10:16.922+00', '2019-06-26 15:10:16.922+00');


--
-- Name: hibernate_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('hibernate_sequence', 1218233, true);


--
-- Name: hy_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('hy_groups_id_seq', 1308, true);



--
-- Data for Name: sequence; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO sequence VALUES ('SEQ_GEN', 2552900);


--
-- Name: user_accessgroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_accessgroup_id_seq', 103, true);


--
-- Name: user_affiliation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_affiliation_id_seq', 641, true);


--
-- Name: user_hy_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_hy_group_id_seq', 6368, true);


--
-- Data for Name: user_unit; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- Name: user_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_unit_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('users_id_seq', 331, true);


--
-- PostgreSQL database dump complete
--
`
    ),
  down: async () => {},
}
