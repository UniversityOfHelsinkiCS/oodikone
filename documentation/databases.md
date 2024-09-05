# Databases

Oodikone uses three main PostgreSQL databases, each for a different purpose. This document contains a simplified overview of each database and the relations between models.

Use Adminer or refer to the actual database for a detailed view of each model and their attributes.

## Storage

### sis-db

The `sis-db` database contains information originating from Sisu.

```mermaid
---
title: sis-db
---
erDiagram
  enrollment }o--|| course : ""
  enrollment }o--|| semesters : ""
  enrollment }o--|| student : ""
  semester_enrollments }o--|| semesters : ""
  semester_enrollments }o--|| student : ""
  credit_teachers }o--|| teacher : ""
  course_types
  curriculum_periods
  credit_teachers }o--|| credit : ""
  credit }o--|| course : ""
  credit }o--|| semesters : ""
  credit }o--|| credit_types : ""
  credit }o--|| student : ""
  studyplan }o--|| student : ""
  studyplan }o--|| sis_study_rights : ""
  sis_study_rights }o--|| study_right_extents : ""
  sis_study_rights }o--|| organization : ""
  sis_study_rights }o--|| student : ""
  sis_study_right_elements }o--|| sis_study_rights : ""
  course_providers }o--|| organization : ""
  course_providers }o--|| course : ""
  programme_module_children }o--|| programme_modules : "references parent"
  programme_module_children }o--|| programme_modules : "references child"
  programme_modules }o--o| organization : "belong to"
```

### kone-db

The `kone-db` database contains information used in various features of Oodikone. This functionality is native to Oodikone and not necessarily directly related to Sisu.

```mermaid
---
title: kone-db
---
erDiagram
  custom_population_searches
  excluded_courses
  open_uni_population_searches
  progress_criteria
  study_guidance_group_tags
  study_programme_pins
  tag ||--o{ tag_student : "belongs to"
  tag
  tag_student
```

### user-db

The `user-db` database contains information about users of Oodikone.

```mermaid
---
title: user-db
---
erDiagram
  users
```

## Caching

### Redis

Redis is used in the backend to cache calculation results.
