# Numeric types

Data used in Oodikone contains some numeric types (or _magic numbers_) that are not self-explanatory. The values of the numeric types are gathered here for convenience and quick reference.

## Extent code

Appears in model Studyright (db: `studyright`) as _extentcode_ (db: `extentcode`) and in model SISStudyRight (db: `sis_study_rights`) as _extentCode_ (db: `extent_code`). Values are defined in the database table `studyright_extents`.

| value | meaning                                             |
| ----: | :-------------------------------------------------- |
|     1 | Bachelor's degree                                   |
|     2 | Master's degree                                     |
|     3 | Licentiate                                          |
|     4 | Doctor                                              |
|     5 | Bachelor's and Master's degree                      |
|     6 | Continuing education                                |
|     7 | Exchange studies                                    |
|     9 | Open University studies                             |
|    13 | Non-degree pedagogical studies for teachers         |
|    14 | Contract training                                   |
|    16 | Studies for secondary school students               |
|    18 | Specialisation studies                              |
|    22 | Non-degree programme for special education teachers |
|    23 | Specialist training in medicine and dentistry       |
|    31 | Summer and winter school                            |
|    34 | Exchange studies (postgraduate studies)             |
|    99 | Non-Degree studies                                  |

## Priority code

> [!WARNING]  
> Obsolete, to be deprecated

Appears in model Studyright (db: `studyright`) as _prioritycode_ (db: `prioritycode`).

| value | meaning   | notes                                                                                       |
| ----: | :-------- | :------------------------------------------------------------------------------------------ |
|     1 | Primary   |                                                                                             |
|     2 | Secondary |                                                                                             |
|     5 | Rescinded | seemingly not in use anymore                                                                |
|     6 | Option    | Ba+Ma students can add a master programme to their study plan before graduating as bachelor |
|    30 | Graduated |                                                                                             |

## Type

> [!WARNING]  
> Obsolete, to be deprecated

Appears in model ElementDetails (db: `element_details`) as _type_ (db: `type`).

| value | meaning                                          |
| ----: | :----------------------------------------------- |
|    20 | study programme                                  |
|    30 | module, studytrack or kokonaisuus e.g. neurology |

## Phase

Appears in model SISStudyRightElement (db: `sis_study_right_elements`) as _phase_ (db: `phase`).

In Finland it is common for new students to be awarded the study right to both a bachelor's and a master's programme when they are admitted to the university. In Oodikone these two-phase study rights are marked with the [extent code](#extent-code) 5. In the study right elements of these study rights, phase 2 marks the second phase of the study right.

For example: Student is awarded the study right in the bachelor's programme in computer science with the extent code 5. The study right element for study right in the bachelor's programme is marked with phase 1. After graduating from the bachelor's programme, the student continues their studies in the master's programme in computer science. The new study right element for the study right in the master's programme is marked with phase 2.

All study right elements for other study rights (extent code other than 5) are marked with phase 1.

The level of the programme (bachelor's, master's etc.) of the study right can be directly checked from degreeProgrammeType (db: `degree_programme_type`) in model SISStudyRightElement (db: `sis_study_right_elements`).

| value | meaning  |
| ----: | :------- |
|     1 | any      |
|     2 | master's |

## Enrollment type

Appears in model SemesterEnrollment (db: `semester_enrollments`) as _enrollmenttype_ (db: `enrollmenttype`).

| value | meaning  | notes                            |
| ----: | :------- | :------------------------------- |
|     1 | Present  |                                  |
|     2 | Absent   |                                  |
|     3 | Inactive | neither 1 or 2 has been declared |

## Credit type code

Appears in model Credit (db: `credit`) as _credittypecode_ (db: `credittypecode`). Values are defined in the database table `credit_types`.

Completed/Improved/Transferred/Failed

| value | meaning          |
| ----: | :--------------- |
|     4 | Completed        |
|     7 | Improved (grade) |
|     9 | Transferred      |
|    10 | Failed           |

## Gender code

Appears in model Student (db: `student`) as _gender_code_ (db: `gender_code`).

| value | meaning |
| ----: | :------ |
|     0 | Unknown |
|     1 | Male    |
|     2 | Female  |
|     3 | Other   |
