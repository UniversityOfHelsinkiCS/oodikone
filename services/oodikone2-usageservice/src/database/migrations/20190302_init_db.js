module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;


--
-- Name: usage_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE usage_statistics (
    id character varying(255) NOT NULL,
    username character varying(255),
    name character varying(255),
    "time" integer,
    admin boolean,
    method character varying(255),
    "URL" character varying(255),
    status integer,
    data jsonb
);


--
-- Name: usage_statistics usage_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY usage_statistics
    ADD CONSTRAINT usage_statistics_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--
`,
        { transaction }
      )
    })
  },
  down: () => {}
}
