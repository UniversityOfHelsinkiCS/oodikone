# How to update the database schema

These instructions explain how to update the schemas for the following databases used by Oodikone:

- `sis-db`
- `user-db`
- `kone-db`

The steps to **add, remove, or modify columns** are mostly the same for each database, but the file paths and container names differ. Always **double-check** that you have the correct function name, column name, data type, and other relevant details in your migration file.

> [!NOTE]  
> If you need to change the `sis-importer-db` schema, see the instructions in the [sis-importer repo](https://github.com/UniversityOfHelsinkiCS/sis-importer/blob/master/README.md#tricks--tips).

## General guidelines

### File names

- Name new migration files using the format `YYYYMMDD_XX_description.js`.
- The `XX` part is a migration number (starting from `00` each day).
- Example: `20250122_00_add_column_to_table.js`.

### Model vs. column names

- Use **camelCase** in your model definitions.
- Use **snake_case** in the actual database columns.
- If a model has `underscored: true`, Sequelize automatically converts camelCase to snake_case in all queries. Otherwise, specify the column name explicitly.

### Verifying the migration locally

- Migrations are run automatically whenever the server restarts.
- After creating a migration, ensure the relevant service is running:
  - For `sis-db`: `npm run both:real` or `npm run updater:real`
  - For `user-db`/`kone-db`: `npm run both:real` or `npm run oodikone:real`
- **Connect to the database container** and check:

  ```bash
  docker exec -it <container-name> psql -U postgres <database-name>-real
  ```

  Replace `<container-name>` and `<database-name>` with the actual values (e.g., `sis-db`, `user-db`, or `kone-db`).

- In the psql prompt, verify your migration:

  ```sql
  SELECT * FROM migrations;
  ```

  Also confirm that the new (or updated) column exists in the appropriate table and has the correct type.

### Deploying changes to production

- **Push changes** to the `master` branch and wait for the workflow to finish.
- For **`sis-db`** migrations (in the updater):
  - You **do not** need to create a new release. Once tests pass, changes to the updater go directly to production.
- For **`user-db`** and **`kone-db`** migrations (in the backend):
  - A new release must be made before the changes go to production.
- After deployment, check logs (for example, in OpenShift) to confirm the migration ran successfully.
- Optionally, use the `db-cli` tool to inspect the production database. See `how_to_db_cli.md` (in GitLab) for instructions.

## `sis-db`

> [!NOTE]  
> These instructions assume that needed data is already in the `sis-importer-db`. If not, you must add the data there first. See the [sis-importer repo](https://github.com/UniversityOfHelsinkiCS/sis-importer/blob/master/README.md#tricks--tips) for more details.

1. **Update the updater model:**

   - Go to `updater/sis-updater-worker/src/db/models/` and choose the model you want to change.
   - Add or modify the column (with its **type** and any other necessary fields).
   - Check the correct data type in the importer.
   - Use camelCase in the model, snake_case in the database.

1. **Update the backend model:**

   - Go to `services/backend/src/models/`.
   - The models are in different formats (JavaScript in the updater, TypeScript in the backend), but follow existing examples.

1. **Create a migration file:**

   - Go to `updater/sis-updater-worker/src/db/migrations/`.
   - Name your file using the format described above (e.g. `20250122_00_add_column_to_table.js`).
     > [!IMPORTANT]  
     > The column name **in the database** (snake_case) must be used in the migration, not the camelCase name from your model.

1. **Run and verify the migration:**

   - Ensure that the updater is running (`npm run both:real` or `npm run updater:real`).
   - Use the steps in [General guidelines](#general-guidelines) to verify.

1. **Push to master and deploy:**
   - Your migration will go to production automatically after tests pass.
   - Check logs in production (OpenShift) or use `db-cli` to confirm success.

## `user-db` and `kone-db`

1. **Update the model:**

   - Go to `services/backend/src/models/kone` (for `kone-db`) or `services/backend/src/models/user.ts` (the only model for user-db)
   - Add or modify the column, type, and any other needed fields. Follow existing models for structure.

1. **Create a migration file:**

   - Go to `services/backend/src/database/`.
   - Use `migrations_kone` (for `kone-db`) or `migrations_user` (for `user-db`).
   - Name the file using the same `YYYYMMDD_XX_description.js` format.
     > [!IMPORTANT]  
     > The column name **in the database** (snake_case) must be used in the migration, not the camelCase name from your model.

1. **Run and verify the migration:**

   - Make sure Oodikone is running (`npm run both:real` or `npm run oodikone:real`).
   - Follow the same verification steps as in [General Guidelines](#general-guidelines).

1. **Push to master and release:**
   - Wait for the CI workflow to pass.
   - **Create a new release**; then check the production logs (in OpenShift) to confirm the migration.
   - Optionally, use `db-cli` to check the production database state (see `how_to_db_cli.md` in GitLab).
