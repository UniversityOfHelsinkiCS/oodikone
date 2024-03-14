# sis-updater-worker

# Highlevel overview of the data flow

1. The worker listens on one of the following channel:
   - `SIS_UPDATER_SCHEDULE_CHANNEL`
   - `SIS_PURGE_CHANNEL`
   - `SIS_INFO_CHANNEL`
   - `SIS_MISC_SCHEDULE_CHANNEL`
2. Each time a message comes on one of the channels, the worker does the following:
   - If the message comes in `SIS_PURGE_CHANNEL` and the message is for **prepurge**, the worker just counts how many entities are to be purged in the upcoming purge and sends back to scheduler a message with that count
   - If the message comes in `SIS_PURGE_CHANNEL` and the message is for **purge**, the worker deletes all the entities that were not updated before the `before` date specified in the message, and sends the acknowledgement back to scheduler
   - If the message comes in `SIS_UPDATER_SCHEDULE_CHANNEL`, the worker fetches the entities from the **importer** database based on `entityIds` received in the message, mangles the data as needed and saves it into **Oodikone database**
   - If the message comes in `SIS_MISC_SCHEDULE_CHANNEL` (which means that the scheduler requests to update student information for certain student numbers), the worker first purges the students based on the ids provided in the message and then run the same update logic as in the point above.
   - If the messages comes in `SIS_INFO_CHANNEL`, the message is either ment to abort already scheduled messages or to reset redis cache
3. In most of the cases, once the worker is done processing a message, it will send an acknowledgement back to the scheduler.
