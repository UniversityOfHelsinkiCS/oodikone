DO $$
DECLARE
  ts TIMESTAMP = CURRENT_TIMESTAMP;
  snumber VARCHAR(50) = '012345678';
  sr_id BIGINT = 1234;
  sre_one VARCHAR(50) = 'SRE1';
  sre_two VARCHAR(50) = 'SRE2';
BEGIN

  INSERT INTO element_details
  ("code", "createdAt", "updatedAt")
  VALUES
  (sre_one, ts, ts),
  (sre_two, ts, ts)
  ;
  INSERT INTO student
  ("studentnumber", "createdAt", "updatedAt")
  VALUES
  (snumber, ts, ts)
  ;

  INSERT INTO studyright
  ("studyrightid", "student_studentnumber")
  VALUES
  (sr_id, snumber)
  ;

  INSERT INTO studyright_elements
  ("createdAt", "updatedAt", "studyrightid", "studentnumber", "code")
  VALUES
  (ts, ts, sr_id, snumber, sre_one),
  (ts, ts, sr_id, snumber, sre_two)
  ;

END $$;