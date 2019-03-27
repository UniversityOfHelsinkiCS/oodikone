DO $$
DECLARE
  ts TIMESTAMP = CURRENT_TIMESTAMP;
  studytrk_01 VARCHAR(50) = 'MH50_010';
  studytrk_02 VARCHAR(50) = 'KH50_005';
  provider_01 VARCHAR(50) = '500-M010';
  provider_02 VARCHAR(50) = '500-K005';
  course_01 VARCHAR(50) = 'M010_COURSE';
  module_01 VARCHAR(50) = 'M010_MODULE';
  course_02 VARCHAR(50) = 'K005_COURSE';
  thesis VARCHAR(50) = 'THESIS_01';
  date_2016 TIMESTAMPTZ = '2016-09-28 00:00:00+00';
  date_2015 TIMESTAMPTZ = '2015-09-28 00:00:00+00';
BEGIN
  INSERT INTO semesters ("semestercode", "createdAt", "updatedAt")
  VALUES
  (5, ts, ts)
  ;
  
  INSERT INTO course
  ("code", "name", "is_study_module")
  VALUES
  (course_01, '{ "en": "COURSE_EN" }', 'false'),
  (module_01, '{ "en": "MODULE_EN" }', 'true'),
  (course_02, '{ "en": "COURSE_EN" }', 'false'),
  (thesis, '{ "en": "Bachelor thesis" }', 'false')
  ;
  
  INSERT INTO credit_types
  ("credittypecode", "createdAt", "updatedAt")
  VALUES
  (10, ts, ts),
  (4, ts, ts)
  ;
  
  INSERT INTO credit
  ("id", "createddate", "lastmodifieddate", "semestercode", "course_code", "credittypecode", "attainment_date", "credits")
  VALUES
  ('CREDIT_01', ts, ts, 5, course_01, 4, date_2016, 5),
  ('CREDIT_02', ts, ts, 5, course_01, 10, date_2016, 5),
  ('CREDIT_03', ts, ts, 5, module_01, 4, date_2016, 20),
  ('CREDIT_04', ts, ts, 5, course_02, 4, date_2016, 5),
  ('CREDIT_05', ts, ts, 5, course_01, 4, date_2015, 5),
  ('CREDIT_06', ts, ts, 5, course_01, 4, date_2015, 5),
  ('CREDIT_07', ts, ts, 5, thesis, 4, date_2015, 30)
  ;
  
  INSERT INTO providers
  ("providercode", "createdAt", "updatedAt")
  VALUES
  (provider_01, ts, ts),
  (provider_02, ts, ts)
  ;
  
  INSERT INTO course_providers
  ("coursecode", "providercode", "createdAt", "updatedAt")
  VALUES
  (course_01, provider_01, ts, ts),
  (module_01, provider_01, ts, ts),
  (course_02, provider_02, ts, ts),
  (thesis, provider_01, ts, ts)
  ;

  INSERT INTO element_details
  ("code", "createdAt", "updatedAt")
  VALUES
  (studytrk_01, ts, ts),
  (studytrk_02, ts, ts)
  ;

  INSERT INTO studyright
  ("studyrightid", "graduated", "enddate")
  VALUES
  (10, 1, date_2016),
  (11, 0, date_2016),
  (12, 1, date_2016)
  ;

  INSERT INTO studyright_elements
  ("studyrightid", "code", "createdAt", "updatedAt")
  VALUES
  (10, studytrk_01, ts, ts),
  (11, studytrk_01, ts, ts),
  (12, studytrk_02, ts, ts)
  ;

  INSERT INTO thesis_courses
  ("programmeCode", "courseCode", "thesisType", "createdAt", "updatedAt")
  VALUES
  (studytrk_01, thesis, 'MASTER', ts, ts);
END $$;