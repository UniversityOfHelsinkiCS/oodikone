# Databases

Oodikone uses three separate databases, each for different purposes. This document contains a simplified overview of each database.

Please note that each database may contain additional information such as migration tables or indices that are not depicted here. For more details, inspect the actual databases via the commandline.

In the tables, `PK` marks primary key(s), `FK` marks foreign keys and `UK` mark unique keys. Refer to the official [Mermaid.js documentation](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) for full syntax.

## kone-db

The `kone-db` database contains information used in various features of Oodikone. This functionality is native to Oodikone and not necessarily directly related to Sisu.

```mermaid
erDiagram
  custom_population_searches {
    bigint         id       PK "not null"
    bigint         userId
    varchar(255)   name        "not null"
    varchar(255)[] students
    timestamp      createdAt
    timestamp      updatedAt
  }
  excluded_courses {
    integer      id                 PK "not null"
    varchar(255) programme_code
    varchar(255) course_code
    timestamp    created_at
    timestamp    updated_at
    varchar(255) curriculum_version
  }
  open_uni_population_searches {
    bigint         id           PK "not null"
    bigint         user_id
    varchar(255)   name            "not null"
    varchar(255)[] course_codes
    timestamp      created_at
    timestamp      updated_at
  }
  progress_criteria {
    varchar(255)   code               PK "not null"
    varchar(255)[] courses_year_one
    varchar(255)[] courses_year_two
    varchar(255)[] courses_year_three
    integer        credits_year_one
    integer        credits_year_two
    integer        credits_year_three
    timestamp      created_at
    timestamp      updated_at
    varchar(255)[] courses_year_four
    varchar(255)[] courses_year_five
    varchar(255)[] courses_year_six
    integer        credits_year_four
    integer        credits_year_five
    integer        credits_year_six
    varchar(255)   curriculum_version
  }
  study_guidance_group_tags {
    bigint       id                      PK "no null"
    varchar(255) study_guidance_group_id UK
    varchar(255) study_programme
    varchar(255) year
    timestamp    created_at
    timestamp    updated_at
  }
  study_programme_pins {
    integer        user_id          PK "not null"
    varchar(255)[] study_programmes
  }
  tag ||--o{ tag_student : "belongs to"
  tag {
    timestamp    createdAt
    timestamp    updatedAt
    varchar(255) tagname
    varchar(255) studytrack          "not null"
    bigint       tag_id           PK "not null"
    varchar(255) year
    bigint       personal_user_id
  }
  tag_student {
    timestamp    createdAt
    timestamp    updatedAt
    varchar(255) studentnumber PK     "not null"
    bigint       tag_id        PK, FK "not null"
  }
```

## user-db

The `user-db` database contains information about users of Oodikone.

```mermaid
erDiagram
  users {
    bigint         id              PK "not null"
    varchar(255)   full_name
    varchar(255)   username        UK
    varchar(255)   language           "default: 'fi'"
    varchar(255)   email
    varchar(255)   sisu_person_id
    timestamp      last_login
    varchar(255)[] roles              "not null, default: []"
    varchar(255)[] programme_rights   "not null, default: []"
  }
```
