# Access rights in Oodikone

## Roles

Roles are defined [here](../services/backend/src/config/roles.ts). Criteria for each role can be found [here](../services/backend/src/services/userService.ts). Currently these roles exist:

- admin
- courseStatistics
- facultyStatistics
- fullSisuAccess
- katselmusViewer
- openUniSearch
- studyGuidanceGroups
- teachers

The roles `openUniSearch`, `teachers` and `studyGuidanceGroups` simply enable certain views (_Open uni student population_, _Teachers_ and _Guidance groups_ respectively).

### courseStatistics

- Can see statistics of every course but year statistics of ≤ 5 students are hidden

### facultyStatistics

- Can see statistics of every course and year

### katselemusViewer

- Enables the _Evaluation overview_ view

### Other roles

|                      | Everybody\* | Admin | fullSisuAccess |
| -------------------- | :---------: | :---: | :------------: |
| Front page           |     ✅      |  ✅   |       ✅       |
| Feedback             |     ✅      |  ✅   |       ✅       |
| University           |     ✅      |  ✅   |       ✅       |
| Language center view |             |  ✅   |                |
| Faculties            |             |  ✅   |       ✅       |
| Updater              |             |  ✅   |                |
| Users                |             |  ✅   |                |
| Programmes           |             |  ✅   |       ✅       |
| Students             |             |  ✅   |       ✅       |
| Teachers             |             |  ✅   |                |
| Guidance groups      |             |       |                |
| Custom population    |             |  ✅   |       ✅       |
| Completed courses    |     ✅      |  ✅   |       ✅       |
| Close to graduation  |             |  ✅   |       ✅       |
| Open uni population  |             |  ✅   |                |
| Evaluation overview  |             |  ✅   |                |
| Courses              |             |  ✅   |       ✅       |

\* = anyone who can log in to Oodikone, check the [IAM groups](#iam-groups) section for more information

## Programmes

There are two types of programme rights: limited and full. Limited rights mean that the user cannot see individual students of those programmes, while a user with full rights can.

Manually given programme rights are **always** full rights. Some of the programme rights are based on user's IAM groups: some only qualify for limited rights, some for full rights.

## IAM groups

A user must be a member of either the `grp-oodikone-basic-users` or `grp-oodikone-users` IAM group to be able to log in to Oodikone. The following IAM groups are used to give roles:

| IAM group                | Role given based on the group |
| ------------------------ | ----------------------------- |
| grp-oodikone-basic-users | courseStatistics              |
| grp-oodikone-users       | facultyStatistics             |
| grp-toska                | admin                         |
| grp-katselmus-\*         | katselmusViewer               |
| hy-one                   | teachers                      |
| hy-ypa-opa-dojo          | openUniSearch                 |

`grp-oodikone-basic-users`: basically the whole staff (hy-\*-allstaff)

`grp-oodikone-users`: more limited (e.g. _koulutussuunnittelijat_, _ospa_, _opintoasiainpäälliköt_, _(vara)dekaanit_, _johtoryhmä_)

`grp-kielikeskus-esihenkilot`: gives access to the language center view
