# oodikone2-backend
Master:
[![Build Status](https://travis-ci.org/UniversityOfHelsinkiCS/oodikone2-backend.svg?branch=master)](https://travis-ci.org/UniversityOfHelsinkiCS/oodikone2-backend)

Trunk:
[![Build Status](https://travis-ci.org/UniversityOfHelsinkiCS/oodikone2-backend.svg?branch=trunk)](https://travis-ci.org/UniversityOfHelsinkiCS/oodikone2-backend)

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

Install node
https://nodejs.org/en/download/

Clone the repository and install the packages in the root of the project:

```
git clone git@github.com:UniversityOfHelsinkiCS/oodikone2-backend.git`
cd oodikone2-backend
npm install
```

Create .env file containing
```
DB_URL=postgres://postgres@localhost:5421/tkt_oodi
TEST_DB=postgres://postgres@localhost:5421/tkt_oodi_test
FRONT_URL=http://localhost:8000
REDIS=localhost
TOKEN_SECRET=IWannaBeTheVeryBest
```

To initiate and seed the redis db, run: 

`npm run init_redis`

and

`npm run seed_redis`

### Running 

#### Dev

Run `npm run dev`

#### Testing

Run `npm test`

## Deployment

Always deploy first to staging! 

When merging from trunk to master Travis builds a docker image for staging and pushes it automatically.

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

To access the database in oodikone.cs.helsinki.fi run: 

`docker exec -it -u postgres db psql -d tkt_oodi`

or

`docker exec -it -u postgres db_staging psql -d tkt_oodi_staging`

To create a dump of the production db, run: 

``docker exec -u postgres db pg_dump tkt_oodi > `date +%Y-%m-%d`.bak``

## Updater

Oodikone2-backend includes the update-script that fetches student data from WebOodi. Script is split on two parts.

### Student list updater

Finds out the valid student nubers. 

Is located in _/home/tkt_oodi/oodikone.cs.helsinki.fi/student_number_updater_ and run with _ update_student_list.sh_

Script is run at background, see _debug.log_ to find out when it is finished.

Environment variable _INCREMENT_ controls how many new student numbers are searched (from the currently konown greatest student number).

At the moment script uses the local postgres (see .env) to save student numbers.

Use _node src/services/doo_api_database_updater/student_list_updater.js filename.txt_ to save student numbers in textfile. 

_/home/tkt_oodi/oodikone.cs.helsinki.fi/student_number_updater_ is acually the backend code as a cloned git repo. If you modify the updater source, remember to pull the repo.

### Student info updater

TBD

### Anonymize data

Run `npm run anonymize` for studentnumbers provided in `studentnumbers.txt` file in root directory. 

Anonymizer will create an `anonymized_API` folder structure which can be used as an alternative to Oodi API and a `studentnumbersN.txt` text file containing new anonymized students studentnumbers.

These can be used to update database with anonymized data by `npm run update_database_anon file="studentnumbersN.txt"`

To update database in oodikone/testing you need to first scp your API and anon studentnumber list to melkki `scp -r src/anonymized_API melkki.cs.helsinki.fi:./` and `scp studentnumbersN.txt melkki.cs.helsinki.fi` then ssh to oodikone/testing and `scp -r <username>@melkki.cs.helsinki.fi:./anonymized_API ./data` and `scp <username>@melkki.cs.helsinki.fi:./studentnumbersN.txt ./data`. Then use `docker exec -it testing_backend sh` and `npm run update_database_anon file="/data/studentnumbersN.txt"`. (Theres probably a better way to scp files into oodikone but this works aswell).
