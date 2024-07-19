# Databases

Oodikone uses three separate databases, each for different purposes. This document contains a simplified overview of each database.

Please note that each database may contain additional information such as migration tables or indices that are not depicted here. For more details, inspect the actual databases via the commandline.

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
