-- Ebin 3y students 4 months ago
SELECT
    org.code,
    org.name->>'fi' AS name,
    studyright.studystartdate,
    COUNT(DISTINCT studyright.student_studentnumber)
FROM organization org
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
                EXTRACT(EPOCH FROM (now() - INTERVAL '4 months')),
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
GROUP BY 1, 3
ORDER BY 1, 3;


-- Ok 4y students
SELECT
    org.code,
    org.name->>'fi' AS name,
    studyright.studystartdate,
    COUNT(DISTINCT studyright.student_studentnumber)
FROM organization org
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
                EXTRACT(EPOCH FROM (now() - INTERVAL '4 months')),
                EXTRACT(EPOCH FROM studyright.studystartdate),
                EXTRACT(EPOCH FROM TIMESTAMP '2021-07-31'),
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
GROUP BY 1, 3
ORDER BY 1, 3;

-- below 4y students
SELECT
    org.code,
    org.name->>'fi' AS name,
    studyright.studystartdate,
    COUNT(DISTINCT studyright.student_studentnumber)
FROM organization org
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
    (credits.credits_sum IS NULL
        OR credits.credits_sum < pg_temp.mapRange(
                EXTRACT(EPOCH FROM (now() - INTERVAL '4 months')),
                EXTRACT(EPOCH FROM studyright.studystartdate),
                EXTRACT(EPOCH FROM TIMESTAMP '2021-07-31'),
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
GROUP BY 1, 3
ORDER BY 1, 3;


CREATE OR REPLACE FUNCTION pg_temp.mapRange(
    input DOUBLE PRECISION, 
    inMin DOUBLE PRECISION, 
    inMax DOUBLE PRECISION, 
    outMin DOUBLE PRECISION, 
    outMax DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
    SELECT (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
$$ LANGUAGE SQL;






-- Studyright element names (type 30) by faculty code
SELECT
    element_details.name->>'fi',
    COUNT(DISTINCT studyright.student_studentnumber)
FROM studyright
    LEFT JOIN
    (
        SELECT student_studentnumber, sum(credits) credits_sum FROM credit
        WHERE attainment_date >= '2017-08-01 03:00:00+00'
        GROUP BY student_studentnumber
    ) credits
        ON credits.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
    LEFT JOIN studyright_elements
        ON studyright.studyrightid = studyright_elements.studyrightid
            AND studyright.student_studentnumber = studyright_elements.studentnumber
    LEFT JOIN element_details
        ON studyright_elements.code = element_details.code
WHERE
    studyright.faculty_code = 'H60'
    AND element_details.type IN (30)
    AND studyright.extentcode = 1
    AND studyright.studystartdate >= '2017-07-31 00:00:00+00'
    AND transfers.studyrightid IS NULL -- not transferredA
GROUP BY 1
ORDER BY 2 DESC;