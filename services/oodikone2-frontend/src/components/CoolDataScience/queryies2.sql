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