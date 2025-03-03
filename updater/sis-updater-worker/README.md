# sis-updater-worker

## High-level overview of the data flow

The **sis-updater-worker** is responsible for processing BullMQ jobs that have been added to the queue by the **sis-updater-scheduler**. Rather than receiving jobs directly from the scheduler, the worker listens for jobs in the queue, processes them, and updates the necessary data.

When a job is picked up, the worker fetches the relevant entities from the **importer** database based on the `entityIds` specified in the job data. It then processes the data as needed and saves it into the **Oodikone database**.

The different types of jobs are defined in [`src/processor.js`](./src/processor.js). Below is a brief overview of the job types:

- **prepurge_start**:

  - `job.data` contains a list of tables and a `before` date.
  - The worker counts the rows in each table that were last updated before the `before` date and sends these counts back to the scheduler.

- **purge_start**:

  - The worker deletes rows in the specified tables where the last update occurred before the `before` date.

- **reload_redis**:

  - Reloads the maps in the Redis cache.

- **students_with_purge**:

  - The worker first purges students based on the IDs provided in the job data.
  - After purging, it runs the same update logic as in the standard student update job.
  - This job type is used when an Oodikone admin manually triggers updates for specific students.

- **Other job types**:
  - The worker fetches entities from the **importer** database based on the `entityIds` in the job data.
  - It processes the data as needed and saves it into the **Oodikone database**.

The worker continuously listens to the queue and processes jobs as they arrive.
