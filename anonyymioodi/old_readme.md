# Old readme of anonyymioodi

This is mostly obsolete, but may help with something sometimes.

## Anonyymioodi - anonymous database setup for oodikone

(name anonyymioodi for :culture: reasons)

This folder contains a guide and scripts to create anonymous database images for oodikone, mainly used for testing.

## How to create / modify database images

Creating / modifying images varies a bit depending on the db. Generally, to modify images, you can either use `psql` directly in docker by running `docker exec -it <dbname> psql -U postgres <dbname>` or start adminer with oodikone's docker-compose.

By default, previous db images from Toska Hub are used as a base. If needed, comment out Toska hub image and uncomment corresponding clean postgres image in docker-compose before running other steps.

See more details on how to create / modify databases below.

### Sis-importer-db

The following steps are for building a clean sis-importer-db image from scratch. If you want to just modify the existing image a bit, follow the steps defined for user-db / kone-db.

- See [sis-importer/importer-db-staging-sampletaker](https://github.com/UniversityOfHelsinkiCS/sis-importer/tree/master/importer-db-staging-sampletaker) and create `sis-importer-db.sqz` dump
- Move `sis-importer-db.sqz` to this folder
- Run `./create_container_from_dump.sh sis-importer-db`
- Enrich db with command in file `enrich_data.sql` either by piping command to container or by running command inside container.

### Sis-db:

The following steps are for building a clean sis-db image from scratch using oodikone's updater. If you want to just modify the existing image a bit, follow the steps defined for user-db / kone-db.

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

(or run these from frontend. You might also want to follow sis-updater-workers logs to ensure things are running smoothly.)

- Clean up any extra stuff you don't want to keep in sis-db.
- Bonus: check that cypress tests run okay

### User-db / kone-db

- Temporarily replace the db service in oodikone's docker-compose.yml with the same db service from this folder's docker-compose.yml
- Ensure the newest user-db/kone-db image is pulled from the registry with `docker-compose pull`
- Modify db to wanted state. Tips:
  - Run oodikone if you want to upgrade something from frontend (e.g. tags in kone-db, courses in sis-db etc.).
  - Easy way to create new users to user-db is to modify dev user details in the frontend API config. A new user is created during login if the given uid is not present in user-db.

## Publishing the image

After completing the steps above and making sure your local version has the correct data, run `./commit_and_push_to_toska_hub.sh <dbname>` to publish the db image to Toska Hub.

## How to update Postgres versions

When Postgres is updated on the server, anon db images need to be updated to match server versions. Do following:

- Ensure you're using toska hub image in docker-compose and that you've pulled the newest image from toska hub: `docker-compose pull <dbname>`.
- Start database with docker-compose
- Create dump from database by running `docker exec -i <dbname> pg_dump -Fc -U postgres <dbname> > <dbname>.sqz`
- Close container with docker-compose down.
- Update the Postgres version in docker-compose.yml in this folder.
- Uncomment row with Postgres image and comment row with Toskahub image.
- Run `./create_container_from_dump.sh <dbname>`, followed by `./commit_and_push_to_toska_hub.sh <dbname>`
