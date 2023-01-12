# Mystery numbers

Sis data uses some numeric classifiers that are not self-explanatory and (most) previously needed to be deciphered from existing code.
Some mystery numbers are gathered here for convenience. Feel free to add anything that could be useful. Remember to use the spelling used in code to enable project wide search.

## extentcode

(from **studyright**)

These are actually defined in db table studyright_extents. Tells studyright level or type, eg. bachelor's degree or non-degree studies.

## prioritycode

(from **studyright**)

1: Primary

2: Secondary

5: Rescinded (Seemingly not in use anymore)

6: Option

30: Graduated

## type

(from **element_details**)

20: A study programme

30: Module/Studytrack/kokonaisuus? Eg. Neurology

## enrollmenttype

(from **semester_enrollments**)

1: Present

2: Absent

3: Inactive (neither 1 or 2 has been declared)

## credittypecode

(from **credit**)

Defined in credit_types db table. Completed/Improved/Transferred/Failed
