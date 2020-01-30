-- matlu, käyttis, Lääkis : H50, H40, H30

-- 2017, 2018 ja 2019 aloittaneet kaikista kolmesta tiedekunnasta:
-- kuinka monta tavoiteajassa
SELECT
    org.code,
    COUNT(DISTINCT studyright.student_studentnumber)
FROM (
    VALUES ('H30'), ('H40'), ('H50')
) org(code)
    INNER JOIN studyright
        ON studyright.faculty_code = org.code
    LEFT JOIN
    (
        SELECT student_studentnumber, sum(credits) credits_sum FROM credit
        WHERE attainment_date >= '2017-08-01 03:00:00+00'
        GROUP BY student_studentnumber
    ) credits
        ON credits.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE
    (credits.credits_sum IS NOT NULL
        AND credits.credits_sum >= pg_temp.mapRange(
                EXTRACT(EPOCH FROM now()),
                EXTRACT(EPOCH FROM studyright.studystartdate),
                EXTRACT(EPOCH FROM TIMESTAMP '2020-07-31'),
                0,
                1
            ) * (
                CASE studyright.studystartdate
                    WHEN '2017-07-31 21:00:00+00' THEN 180
                    WHEN '2018-07-31 21:00:00+00' THEN 120
                    WHEN '2019-07-31 21:00:00+00' THEN 60
                    ELSE -1
                END
            )
    )
    AND studyright.extentcode = 1
    AND studyright.studystartdate >= '2017-07-31 00:00:00+00'
    AND transfers.studyrightid IS NULL -- not transferredA
GROUP BY org.code;

CREATE OR REPLACE FUNCTION pg_temp.mapRange(
    input DOUBLE PRECISION, 
    inMin DOUBLE PRECISION, 
    inMax DOUBLE PRECISION, 
    outMin DOUBLE PRECISION, 
    outMax DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
    SELECT (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
$$ LANGUAGE SQL;