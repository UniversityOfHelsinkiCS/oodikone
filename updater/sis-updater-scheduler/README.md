# sis-updater-scheduler

The scheduler is mainly responsible for publishing NATS messages with entity ids that should be updated. The messages will then be picked up by sis-updater-worker, and the entities with the specified ids will be updated. The way the worker will do it is by fetching the needed entities from the importer DB and upserting them to Oodikone's own DB.

The scheduler publishes NATS messages with entity ids to be updated mainly based on 2 triggers:
**cronjobs** and **HTTP requests**. The HTTP requests are used if one of the Oodikone users (admins only) wants to proactively trigger an update to certain entities or entity types.

The cronjobs are part of the same Node.js process. There are two cronjobs that trigger entity updates: one running weekly and one running hourly. Depending on the type of entity, they are therefore updated on a weekly or hourly basis.

There are also cronjobs to run `prepurge` and `purge` jobs on the weekly basis. See below for more info about `purge` and `prepurge`.

## Step by step overview of what Scheduler does:

1. The cronjob runs one of the two functions: `scheduleHourly` or `scheduleWeekly`. The first one only schedules the data that was modified since the last hourly update. `scheduleWeekly` on the other hand schedules "everything" for update.
2. To figure out what entities should be scheduled, the scheduler fetches ids of entities from the **importer's** postgres instance. Depending on whether the cronjob run is hourly or weekly, the scheduler fetches either all ids of the ones belonging to entities updated in the last hour only.
3. For each entity separately, the ids are then split into smaller chunks (based on `CHUNK_SIZE` env variable) and are sent to `sis-updater-worker` via NATS. Before sending the NATS message, the scheduler increments a redis key (one of the two, either `TOTAL_STUDENTS` if the entity type is `student` or `TOTAL_META` if the entity type is anothing else) by the number of entities being sent to NATS. The redis entry is updated so that `sis-updater-worker` can use it (see worker's README for more details).
4. Depending on the value of `ENABLE_WORKER_REPORTING` constant, scheduler will either just publish the message to NATS and forget about it moving on to the next things **OR** it will wait for the `-worker` to successfully acknowledge the processing of the message before moving one to the next one. Note however, that entities of the same type e.g. `student` entities are scheduled in parallel even if `ENABLE_WORKER_REPORTING` is set to true. It's just that in that case, the scheduler will first wait for all successful acks for one entity type before moving on to the next one.  

## Prepurge and purge workflows

Rows are sometimes deleted from Sisu, which means they should also be deleted from Oodikone's database. This is done by deleting all rows which have not been updated in a while.

Every Monday a prepurge flow is scheduled and every Sunday a purge flow.

Each of the flows go through all of the `TABLES_TO_PURGE` one at a time and does the following:

**The prepurge flow** sends a message to NATS of the following shape `{ action: 'PREPURGE_START', table, before }` where table is the name of the purged table and `before` is the date before which all the old data will be purged.
It also creates a feedback channel, which listens to responses from `sis-updater-worker` and each time a response to prepurge message is received, the schedule does the following:
- Calculate how many rows of data will be deleted as a result of the **upcoming** purge and from which tables
- Send a Slack message informing how many rows and from which tables will be deleted
- Sets metadata to Redis indicating after what date the corresponding purge can actually be run. This is later used during purge flow to determine if the purge is actually allowed to be run at that point in time. There is a minimum number of days that should pass between prepurge and purge before the purge is allowed to run.

**The purge flow** gets the metadata from the Redis mentioned above to determine if the purge can be run at this point in time or not yet. If it is allowed to run, then for each of the purged tables, the scheduler sends the following message to NATS `{ action: 'PURGE_START', table, before: purgeTargetDate }`.

