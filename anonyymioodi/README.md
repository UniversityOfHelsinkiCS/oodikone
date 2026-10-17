# Anonyymioodi - test database setup

This folder contains a guide and scripts to modify or create anonymous database images for Oodikone, mainly used for testing.

The quick guide should be enough for most purposes: updating schema, data, or the PostgreSQL version. If you need to generate completely new `sis-importer-db` and `sis-db` images (which shouldn't happen too often), follow the instructions in the section [Generate new sis-importer-db and sis-db completely from scratch](#generate-new-sis-importer-db-and-sis-db-completely-from-scratch).

## Scripts

`manage_test_dbs.sh` is the front end for the test database tooling. Run it without arguments for an interactive menu, or give it an action and one or more databases (or `all`) to run it directly:

```bash
./manage_test_dbs.sh dump sis-db      # dump sis-db from its running container
./manage_test_dbs.sh upload sis-db    # upload the current dump to s3
./manage_test_dbs.sh release all      # dump, upload and push images for every database
```

Actions are `download`, `dump`, `upload` (upload + prune), `push`, `prune`, `release` (dump + upload + prune + push) and `rebuild` (download + push). Each one is a thin call to a script in this folder, which can also be used on its own:

| Script                     | What it does                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `dump_local_db.sh`         | `pg_dump`s the databases from the running containers into `.databasedumps/`                                            |
| `download_dump_from_s3.sh` | Downloads the newest dump of each database from s3 (`-b <branch>` to pick dumps from a single branch)                  |
| `upload_dump_to_s3.sh`     | Uploads the dumps in `.databasedumps/test` to s3 as `<database>-<git_branch>-<datetime>.sql`                           |
| `prune_s3_dumps.sh`        | Deletes dumps older than 30 days from s3, always keeping the newest `master` dump of each database (`-d <days>`, `-n`) |
| `build_and_push_image.sh`  | Builds database images from the current dumps and pushes them to the Toska registry                                    |
| `create_s3_bucket.sh`      | Creates the s3 bucket if it doesn't exist yet, run automatically before an upload                                      |
| `lib/common.sh`            | Shared configuration (dump directories, s3 bucket, registry, database names)                                           |

Dumps end up in `.databasedumps/test/<database>.sql`, which is where `db.Dockerfile` reads them from when an image is built. The s3 commands read their credentials from the `ACCESS_KEY` and `SECRET_KEY` environment variables (e.g. in CI). If neither is set, they fall back to `~/.s3cfg`, which can be found on the toska/dokumentaatio repo.

## Quick guide to updating a test database

1. Ensure you have the latest test-db. Just pulling images might not replace your existing volume, so you may need to remove it manually. This command might work: `docker volume rm oodikone-sis-db-data` (replace `oodikone-sis-db-data` with the correct volume name). The new image, including data, should be pulled the next time you launch Oodikone normally.

2. Do your dev work as usual with the test database, for example, using `npm run both`. Edit data as needed, (for example, run the updater via the frontend), and then run tests to see if they pass (follow the instructions in the [README](../README.md) to run the tests more quickly).

3. If you're updating `sis-db`:

   - Modify the scheduler limit in [config.ts](../updater/sis-updater-scheduler/src/config.ts) by setting `export const DEV_SCHEDULE_COUNT = null` if it is not already null.
   - Follow the `sis-updater-worker` logs to ensure everything is running smoothly (`docker logs --follow oodikone-sis-updater-worker`).

4. When you're satisfied with the database, create a dump:

   - Use the command: `docker exec -i <dbname> pg_dump -Fc -U postgres <dbname> > anonyymioodi/<dbname>.sqz`.

5. Shut down the environment with `npm run docker:down`.

6. Navigate to this folder: `cd anonyymioodi`.

7. If you need to update the PostgreSQL version, do it now by changing the version in this directory's `docker-compose.yml`. The version should match the one used on the server to avoid compatibility issues.

8. Create a new container from the dump: `./create_container_from_dump.sh <dbname>`.

9. Commit and push it to the Toska registry: `./commit_and_push_to_toska_hub.sh <dbname>`.

10. Bring down the environment with `docker compose down`.

## Generate new sis-importer-db and sis-db completely from scratch

> [!CAUTION]
> The more the data in `sis-importer-db` and `sis-db` changes, the more tests might break. Because of this, it's highly recommended to make as few changes as possible (for example, avoid changing the degree programs whose students are used in the test data).
>
> If you only need to make small changes, follow the quick guide above.

### Sis-importer-db

1. To generate a sample dump from test Sisu data, follow the instructions at [importer-db-staging-sampletaker](https://github.com/UniversityOfHelsinkiCS/sis-importer/tree/master/importer-db-staging-sampletaker) inside the `sis-importer` repo.

2. Copy `sis-importer-db.sqz` into this folder.

3. Run the following commands (in this folder) to create a new image from the dump and push it to the Toska registry:

   ```bash
   ./create_container_from_dump.sh sis-importer-db
   ./commit_and_push_to_toska_hub.sh sis-importer-db
   docker compose down
   ```

### Sis-db

1. To ensure the newest `sis-importer-db` image is used:

   - Delete all `sis-importer-db` images you have locally (list images with `docker images`, delete with `docker rmi <image ID>`).
   - Also, delete the old `sis-importer-db` volume (`docker volume rm sis-importer-db-data`).

2. Start Oodikone and Updater with `npm run both` (this will pull the newest `sis-importer-db` image you just pushed in the previous step).

3. Truncate all tables in `sis-db` **_except for `migrations` and `semesters`_** (the easiest way is to use Adminer).

4. Modify the scheduler limit in [config.ts](../updater/sis-updater-scheduler/src/config.ts) by setting `export const DEV_SCHEDULE_COUNT = null` if it is not already null.

5. Navigate to <http://localhost:3000/updater> and click the three buttons (Update meta, Update students, Update curriculums) one by one. This will populate `sis-db` with data from the new `sis-importer-db`. You might want to do each update a couple of times, as the database tables affect each other, and not all necessary data might be generated on the first try.

6. Follow the `sis-updater-worker` logs to ensure everything is running smoothly (`docker logs --follow oodikone-sis-updater-worker`). If you see any errors, try clicking the buttons again.

7. Run all the tests to ensure everything is working as expected (follow the instructions in the [README](../README.md) to run the tests more quickly). If any tests fail, update the test files accordingly.
