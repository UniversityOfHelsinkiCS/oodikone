# Anonyymioodi - anonymous database setup for oodikone

(name anonyymioodi for :culture: reasons)

This repository contains a guide and scripts to create docker images from database dumps and/or push database images to Toska Hub docker registry. Images are mostly used by oodikone.

## How to update database images

Updating images varies a bit depending on the db you're trying to update. Complete steps as defined below and run `./commit_and_push_to_toska_hub.sh <dbname>` to publish the image you've created.

### Sis-importer-db

The following steps are for building a clean sis-importer-db image from scratch. If you want to just modify the existing image a bit, follow the steps defined for user-db / kone-db.

- See [sis-importer/importer-db-staging-sampletaker](https://github.com/UniversityOfHelsinkiCS/sis-importer/tree/master/importer-db-staging-sampletaker) and create `sis-importer-db.sqz` dump
- Move `sis-importer-db.sqz` to this folder
- Run `./create_container_from_dump.sh sis-importer-db`
- Enrich data according to what's in `enrich_data.sql` file

### Sis-db:

The following steps are for building a clean sis-importer-db image from scratch using the sis-updater. If you want to just modify the existing image a bit, follow the steps defined for user-db / kone-db.

- Temporarily replace sis-db -service in oodikone's docker-compose.yml with sis-db -service from this repo's docker-compose.yml
- Ensure the newest sis-importer-db image is pulled from toska hub in oodikone repo
- Modify sis scheduler limit in config.js by setting: `module.exports.DEV_SCHEDULE_COUNT = null`
- Start updater, see oodikone readme for more info.
- Populate sis-db from sis-importer-db:

```
curl --request GET --url 'http://localhost:8082/v1/meta?token=dev' && \
curl --request GET --url 'http://localhost:8082/v1/programmes?token=dev' && \
curl --request GET --url 'http://localhost:8082/v1/students?token=dev'
```

(It might be a good idea to follow sis-updater-worker logs while updater is running)

- Clean up any extra stuff you don't want to keep in sis-db.
- (Bonus: check that cypress tests run okay)

### User-db / kone-db

- Temporarily replace user-db/kone-db -service in oodikone's docker-compose.yml with the same service from this repo's docker-compose.yml
- Ensure the newest user-db/kone-db image is pulled from the registry with `docker pull`
- Start oodikone, let it run migrations
- Modify db to wanted state. Tips:
  - Easy way to create new users is to modify dev user details in the frontend API config. A new user is created during login if the given uid is not present in user-db.

By default, previous user-db/kone-db images are used as a base. If you want to build the image from a clean Postgres image, just comment out toska hub image and uncomment the clean Postgres image.

## How to modify database images

If you need to clean up / modify / do whatever with dbs, either use `psql` directly in docker by running `docker exec -it <dbname> psql -U postgres <dbname>` or start adminer with oodikone's docker-compose.

## How to update Postgres versions

When Postgres is updated on the server, anon db images need to be updated to match server versions. Do following:

- Ensure you're using toska hub image in docker-compose and that you've pulled the newest image from toska hub: `docker-compose pull <dbname>`.
- Start database with docker-compose
- Create dump from database by running `docker exec -i <dbname> pg_dump -Fc -U postgres <dbname> > <dbname>.sqz`
- Close container with docker-compose down.
- Update the Postgres version in docker-compose.yml in this folder.
- Uncomment row with Postgres image and comment row with Toskahub image.
- Run `./create_container_from_dump.sh <dbname>`, followed by `./commit_and_push_to_toska_hub.sh <dbname>`
