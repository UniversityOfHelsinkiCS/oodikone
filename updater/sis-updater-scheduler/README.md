# sis-updater-scheduler

## Overview

The **sis-updater-scheduler** is responsible for scheduling entity updates by publishing BullMQ jobs. These jobs contain entity IDs that need updating and are processed by **sis-updater-worker**. The worker retrieves the required entities from the importer database and upserts them into Oodikone's database.

## Job triggers

The scheduler creates BullMQ jobs based on two triggers:

1. **Cron jobs**:
   - There are two scheduled cron jobs:
     - A **weekly job** that updates all relevant entities.
     - An **hourly job** that updates only entities modified since the last hourly update.
   - Additionally, there are cron jobs for **prepurge** and **purge** processes, which help remove outdated data. See the [Prepurge and purge workflows](#prepurge-and-purge-workflows) section for more details.
1. **HTTP requests**:
   - Oodikone admins can manually trigger updates for specific entities or entity types via HTTP requests.

## How the scheduler works

1. A cron job runs either `scheduleHourly` or `scheduleWeekly`:
   - `scheduleHourly`: Updates only entities that have been modified since the last hourly update. This ensures that changes such as new attainments or recently updated student data are quickly reflected in Oodikone.
   - `scheduleWeekly`: Updates all relevant entities, including those that may not have been considered in hourly updates. Some changes, such as modifications to study plans, are only processed in the weekly update.
1. The scheduler fetches the entity IDs from the **importer database**.
1. The fetched IDs are split into smaller chunks (based on the `CHUNK_SIZE` environment variable).
1. BullMQ jobs are created with these chunks and added to the queue, where they will be processed by **sis-updater-worker**.

By combining hourly and weekly updates, we ensure that Oodikone reflects the latest available data as quickly as possible while also periodically performing a full refresh to capture any changes that might otherwise be missed.

## Prepurge and purge workflows

Entities deleted from Sisu must also be removed from Oodikone’s database. This is done by deleting rows that haven’t been updated in a while.

- **Prepurge**: Runs every **Monday**.
- **Purge**: Runs every **Sunday**.

### Prepurge process

Prepurge identifies outdated rows before they are permanently deleted:

1. The scheduler creates a BullMQ job with:
   - `tables`: List of tables to check (`TABLES_TO_PURGE`).
   - `before`: A date threshold; rows older than this will be deleted (based on the `updatedAt` column).
1. The scheduler listens for a response from **sis-updater-worker** ([`src/jobEvents.js`](./src/jobEvents.js)).
1. The worker returns a count of outdated rows per table.
1. Based on this data, the scheduler:
   - Sends a **Slack notification** about the upcoming purge.
   - Updates the **Redis key `LAST_PREPURGE_INFO`**, which determines when the acual purge can occur.

### Purge process

The purge permanently removes outdated rows if the required waiting period has passed:

1. The scheduler checks Redis to determine if purging is allowed.
1. If permitted, a BullMQ job is created with the same `tables` and `before` parameters as the prepurge job.
1. The **sis-updater-worker** processes the job and deletes outdated rows.

For more details, see the purge implementation in [`src/purge.js`](./src/purge.js).
