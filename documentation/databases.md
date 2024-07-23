# Databases

Oodikone uses three separate databases, each for different purposes. This document contains a simplified overview of each database and the relations between models.

Use Adminer or refer to the actual database for a detailed view of each model and their attributes.

## sis-db

The `sis-db` database contains information originating from Sisu.

_To be documented._

## kone-db

The `kone-db` database contains information used in various features of Oodikone. This functionality is native to Oodikone and not necessarily directly related to Sisu.

```mermaid
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

## user-db

The `user-db` database contains information about users of Oodikone.

```mermaid
erDiagram
  users
```
