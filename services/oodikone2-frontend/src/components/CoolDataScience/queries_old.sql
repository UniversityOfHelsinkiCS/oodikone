-- Tavoiteaika~: >=55
-- +1 aika: >= 40
-- Jäte: < 40


-- Studyrights of extent 1 (bachelors) under matlu (H50) who started 2017
SELECT
    COUNT(DISTINCT studyright.student_studentnumber) AS student_count
FROM studyright
    LEFT JOIN transfers
        ON studyright.student_studentnumber = transfers.studentnumber
WHERE
    studyright.extentcode = 1 -- bachelor's
    AND studyright.faculty_code = 'H50' -- matlu
    AND studyright.studystartdate = '2017-07-31 21:00:00+00' -- 2017
    AND transfers.studyrightid IS NULL; -- not transferred


-- ANY credits on first year
SELECT COUNT(DISTINCT studyright.student_studentnumber)
FROM studyright
    INNER JOIN
    (
        SELECT student_studentnumber FROM
            (
                SELECT student_studentnumber, sum(credits) credits_sum FROM credit
                WHERE attainment_date BETWEEN '2017-08-01 03:00:00+00' AND '2018-07-31 20:59:59+00'
                GROUP BY student_studentnumber
            ) student_credits
    ) opcount
        ON opcount.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND transfers.studyrightid IS NULL; -- not transferred


-- Amount of students who earned 55 or more credits on first semester
SELECT COUNT(DISTINCT studyright.student_studentnumber)
FROM studyright
    INNER JOIN
    (
        SELECT student_studentnumber FROM
            (
                SELECT student_studentnumber, sum(credits) credits_sum FROM credit
                WHERE attainment_date BETWEEN '2017-08-01 03:00:00+00' AND '2018-07-31 20:59:59+00'
                GROUP BY student_studentnumber
            ) student_credits
        WHERE student_credits.credits_sum >= 55
    ) over55op
        ON over55op.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND transfers.studyrightid IS NULL; -- not transferred

-- Amount of students who earned >= 40 < 55 credits on first semester
SELECT
    COUNT(DISTINCT studyright.student_studentnumber)
FROM
    studyright INNER JOIN (
    SELECT student_studentnumber
    FROM (
        SELECT
            student_studentnumber,
            sum(credits) credits_sum
        FROM credit
        WHERE
            attainment_date BETWEEN '2017-08-01 03:00:00+00' AND '2018-07-31 20:59:59+00'
        GROUP BY student_studentnumber
    ) student_credits
    WHERE
        student_credits.credits_sum >= 40
        AND student_credits.credits_sum < 55
    ) over55op
        ON over55op.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND transfers.studyrightid IS NULL;


-- Amount of students who earned < 40 credits on first semester
SELECT COUNT(DISTINCT studyright.student_studentnumber)
FROM studyright
    INNER JOIN
    (
        SELECT student_studentnumber FROM
            (
                SELECT student_studentnumber, sum(credits) credits_sum FROM credit
                WHERE attainment_date BETWEEN '2017-08-01 03:00:00+00' AND '2018-07-31 20:59:59+00'
                GROUP BY student_studentnumber
            ) student_credits
        WHERE student_credits.credits_sum < 40
    ) over55op
        ON over55op.student_studentnumber = studyright.student_studentnumber
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND transfers.studyrightid IS NULL; -- not transferred



-- No credits on first year
SELECT
    COUNT(DISTINCT studyright.student_studentnumber) AS student_count
FROM studyright
    LEFT JOIN transfers
        ON studyright.student_studentnumber = transfers.studentnumber
    LEFT JOIN credit
        ON studyright.student_studentnumber = credit.student_studentnumber
        AND attainment_date BETWEEN '2017-08-01 03:00:00+00' AND '2018-07-31 20:59:59+00'
WHERE
    studyright.extentcode = 1 -- bachelor's
    AND credit.id IS NULL
    AND studyright.faculty_code = 'H50' -- matlu
    AND studyright.studystartdate = '2017-07-31 21:00:00+00' -- 2017
    AND transfers.studyrightid IS NULL; -- not transferred




-- Those who graduated  
SELECT
    COUNT(DISTINCT studyright.student_studentnumber) AS student_count
FROM studyright
    LEFT JOIN transfers
        ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND studyright.graduated = 1
    AND transfers.studyrightid IS NULL; -- not transferred


-- Those who were cancelled  
SELECT
    COUNT(DISTINCT studyright.student_studentnumber) AS student_count
FROM studyright
LEFT JOIN transfers
    ON studyright.studyrightid = transfers.studyrightid
WHERE studyright.extentcode = 1
    AND studyright.faculty_code = 'H50'
    AND studyright.studystartdate = '2017-07-31 21:00:00+00'
    AND studyright.canceldate IS NOT NULL
    AND transfers.studyrightid IS NULL; -- not transferred