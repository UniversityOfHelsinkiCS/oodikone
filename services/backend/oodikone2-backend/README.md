# oodikone2-backend

## Dev

### Getting started

To install docker & docker-compose to run postgres and redis follow these steps:

Install docker CE: https://docs.docker.com/engine/installation/ 

Install docker-compose: https://docs.docker.com/compose/install/

Create docker-compose.yml file containing following:

```
version: '3'

services:
  db:
    image: postgres:9.6.3
    ports:
      - "5421:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
    container_name: oodi_db
  redis:
    image: redis
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"
    volumes:
      - ./redis-data:/data
    container_name: redis

```

To start a redis and a database, run:

```docker-compose up -d```

Copy a backup dump from oodikone

`scp oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/2018-08-01.bak <local folder>`

Create database tkt_oodi:

`docker exec -u postgres oodi_db psql -c "CREATE DATABASE tkt_oodi"`

Fill database with data from backup file: 

`cat 2018-08-01.bak | docker exec -i oodi_db psql -U postgres -d tkt_oodi`

Check that you have all the data you ever wanted:

`docker exec -it -u postgres oodi_db psql -d tkt_oodi`

`\dt`

Create test database:

`docker exec -u postgres oodi_db psql -c "CREATE DATABASE tkt_oodi_test"`

Fill database with data from test.bak dump file: 

`cat test.bak | docker exec -i oodi_db psql -U postgres -d tkt_oodi_test`

### Running 

#### Dev

Run `npm run dev`

#### Testing

Run `npm test`

## Deployment

Always deploy first to staging! 

When merging from trunk to master Travis builds a docker image for staging and pushes it automatically to dockerh-hub. Currently **staging** is also automatically deployed after the image is pushed.

When a release (or tag) is created in master branch Travis builds a docker image for production and pushes it automatically.

### To update: 

Log into svm-59 (aka oodikone)

`ssh {username}@oodikone.cs.helsinki.fi`

Switch user to tkt_oodi

`sudo su - tkt_oodi`

Navigate to correct folder
`cd oodikone.cs.helsinki.fi` or `cd oodikone.cs.helsinki.fi/staging`

Use the update script to restart the software
`./update.sh`

Be amazed!

## In case you mess up your DB

Drop your current db

`docker exec -u postgres oodi_db dropdb tkt_oodi`

Copy a backup dump from oodikone

`scp oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/2018-08-01.bak <local folder>`

Create a new database and fill it with the backup dump following the instructions above

## Accessing production/staging DB

To access the database in oodikone.cs.helsinki.fi you can use `postgres_connect.sh` script in production/staging directory. Alternatively you can use commands: 

`docker exec -it -u postgres db psql -d tkt_oodi`

or

`docker exec -it -u postgres db_staging psql -d tkt_oodi_staging`

Production db backups are taken daily and can be found in /var/toska/tkt_oodi/backups/postgres/. Symlink to latest backup can always be found as /home/tkt_oodi/backups/latest-pg.bak.bz2.

To create a dump of the production db manually, run: 

``docker exec -u postgres db pg_dump tkt_oodi > `date +%Y-%m-%d`.bak``

## Updater

Oodikone2-backend includes the update-script that fetches student data from WebOodi. Script is split on two parts. Both production and staging environments have separate updater set up, in directories /oodikone.cs.helsinki.fi/updater and /oodikone.cs.helsinki.fi/staging/updater respectively. Both of updater directories have README file with summary of commands. Container names are production_updater and staging_updater, replace in examples below CONTAINER_NAME with correct one. Both containers have updater_files-directory that is mounted within container to /updater_files.

Updater uses respective backend-image (production or staging, respectively).

### Student list updater

Finds out the valid student nubers. 

Run in updater directory with _update_student_list.sh_

Updater is run in separate detached container, see graylog or _debug.log_ to find out when it is finished.

Environment variable _INCREMENT_ (currently not set) controls how many new student numbers are searched (from the currently known greatest student number).

At the moment script uses the local postgres (see .env) to save student numbers.

Use _docker-compose run -d CONTAINER_NAME node src/services/doo_api_database_updater/student_list_updater.js /updater_files/all_student_numbers.txt_ to save student numbers in textfile. 

### Student info updater (database updater)

To update your database run `docker-compose run -d CONTAINER_NAME npm run update_database` with optional args `file="<filename>"` and `index=<number>` with former telling the studentnumber filename to update and latter telling which row to start from.


### Anonymized data & E2E environment

Use [oodikone-cli](https://github.com/UniversityOfHelsinkiCS/oodikone) to setup you're environments.

Before running cli make yourself a deployment key for Anonyymioodi private repository and put it in your cli folder as `private.key`. This allows you to download the anonymized dumps from the repository.

For local development use with anonymized data use `2) Anon setup` (you can run e2e tests with this).

`1) e2e setup` is designed for use in travis. But you can still try it locally if you want to.

Run E2E tests in ToskaWatch with `npm run cypress:run` or `npm run cypress:open` for local tests.


## Teacher leader board statistics

The statistics for the teacher leader board have to be calculated separately with a script.

```
# Update top teachers for academic years 50 (1999-20) through 70 (2018-19).
docker-compose run -d CONTAINER_NAME npm run update_top_teachers from=50 to=70

# Omit the to–argument to update teachers just for a single academic year. 
docker-compose run -d CONTAINER_NAME npm run update_top_teachers from=50
```

## DEFA report

The npm script `create_defa_report` can quickly aggregate data about DEFA students and display it in neat csv format. Here's how you can use it on the Oodikone production server. It does not work if run locally.

### Input files

Input files should be placed in the `/home/tkt_oodi/oodikone.cs.helsinki.fi/defa` directory unless a different directory has been included into the backend docker container as `/usr/src/app/defa`.

* `params.json`
  * Defines the input/output files. File paths are for the container, so the working directory is `/usr/src/app/defa/`.
  * Defines the timeframe to look at: from `params.in.timeframe.start` to `params.in.timeframe.end`. Studyattainments outside this timeframe will not be considered to be part of DEFA. Changing the timeframe is the main reason you'd want to make changes to this file.
  * Example:
```
{
  "out": {
    "report": "/usr/src/app/defa/defa-report.csv",
    "stats": "/usr/src/app/defa/defa-stats.csv"
  },
  "in": {
    "course_ids": "/usr/src/app/defa/ids.txt",
    "included_courses": "/usr/src/app/defa/included.txt",
    "required_courses": "/usr/src/app/defa/required.txt",
    "timeframe": {
      "start": "2018-09-01T01:00:00.000Z",
      "end": "2019-06-30T01:00:00.000Z"
    }
  }
}
```

* `ids.txt` (or another name specified in `params.in.course_ids`)
  * Holds the courseunitrealisation ids of DEFA courses to be included in the report.
  * Example:
```
126240934
126237007
126238082
126239325
12699580
```

* `included.txt` (or another name specified in `params.in.included_courses`)
  * Holds the learningopportunity ids of courses to be included in the report. Basically put all DEFA course codes here.
  * One id per line.
  * AY courses like `AYTKT0000` can be entered without the `AY` prefix to match both with and without it. e.g. `TKT0000` matches both `TKT0000` and `AYTKT0000`. `AYTKT0000` will only match `AYTKT0000`.
  * Example:
```
TKT10002
TKT10003
MAT11001
TKT10004
TKT20001
TKT20004
TKT20009
TKT21007
MAT12001
MAT12002
```

* `required.txt` (or another name specified in `params.in.required_courses`)
  * Holds the learningopportunity ids of courses that are required to complete for a DEFA student to qualify.
  * Same format as `included.txt`.
  * All entries in this file should also be in `included.txt`.
  * Example: same as `included.txt`

### Running

1. Make sure the backend docker container is running.
2. run `docker exec <backend container> npm run create_defa_report defa/<parameter json file>` or use the ready made script `/home/tkt_oodi/oodikone.cs.helsinki.fi/defa/create_report.sh`.
3. Check the output files.

### Output files

Output files will be created in the same directory where the input files are. Old output files will be overwritten unless they have been renamed/moved. 

* `defa-report.csv` (or another name defined in `params.out.report`)
  * Contains individual information about each DEFA student and individual inforamtion about each DEFA course.
  * Contains aggregate information about all DEFA students.

* `defa-stats.csv` (or another name defined in `params.out.stats`)
  * Contains the credit amount distribution of DEFA students.
