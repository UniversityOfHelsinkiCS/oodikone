# Access rights in Oodikone

## Roles

Roles are defined [here](../services/backend/src/config/roles.ts). Criteria for each role can be found [here](../services/backend/src/services/userService.ts). Currently these roles exist:

- admin
- courseStatistics
- facultyStatistics
- fullSisuAccess
- openUniSearch
- studyGuidanceGroups
- teachers

The roles `facultyStatistics`, `openUniSearch`, and `studyGuidanceGroups` simply enable certain views (_Faculties_, _Open uni student population_, and _Guidance groups_ respectively).

### courseStatistics

- Can see statistics of every course but year statistics of ≤ 5 students are hidden
  - If the user has [full rights](#programmes) to **any** programme, they can also see exact statistics even if there are ≤ 5 students (the same behavior as with `admin` or `fullSisuAccess` roles)

### teachers

- By default, the role only allows seeing the statistics of course providers (degree programmes) they have full rights to (see [Programmes](#programmes))
- This role always needs to be given and removed manually
- If the user is a member of the `hy-dekaanit` or `hy-varadekaanit-opetus` IAM group (or is an admin), they can see leaderboards, information about individual teachers, and statistics of all course providers. They don't need to be given the `teachers` role manually.

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
| hy-ypa-opa-dojo          | openUniSearch                 |

`grp-oodikone-basic-users`: basically the whole staff (hy-\*-allstaff)

`grp-oodikone-users`: more limited (e.g. _koulutussuunnittelijat_, _ospa_, _opintoasiainpäälliköt_, _(vara)dekaanit_, _johtoryhmä_)

`grp-kielikeskus-esihenkilot`: gives access to the language center view
