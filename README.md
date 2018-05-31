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

(For production database we created user tkt_oodi, but for development we can use postgres.)

Create database tkt_oodi:

`docker exec -u postgres oodi_db psql -c "CREATE DATABASE tkt_oodi"`

Fill database with data from dump.bak file: 

`cat dump.bak | docker exec -i oodi_db psql -U postgres -d tkt_oodi`

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

### Running 

#### Dev

Run `npm run dev`

Check in your browser for

http://localhost:8080/api/tags

If you see a response you can congratulate yourself on succesfully installing and running OodiKone2 backend.

#### Testing

Run `npm test`

## Deployment

Log into svm-59 (aka oodikone) and navigate to the correct folder

`ssh {username}@oodikone.cs.helsinki.fi`

Log in as tkt_oodi
`sudo su - tkt_oodi`

Navigate to correct folder
`cd oodikone.cs.helsinki.fi`

Use the update script to restart the software
`./update.sh`

Be amazed!

## Updater

Oodikone2-backend includes the update-script that fetches student data from WebOodi. 

### Dev

TODO: add here instructions for correct dev config

First you need to run the node proxy, this will be clarified in the near future

To run the with every student number:
`npm run update_database_dev`

If you wish to run the updater for a specific group of students, creata a text file with the name 'student_numbers' with the wanted student numbers in the root of the project. *Never ever push any student numbers to github*

Run the with a student number list:
`npm run update_student_group_dev`

### Production

If you want to run the script manually (not wait until saturday):

NOTE: Staging and production *use the same database*. Update scripts works both with staging and production versions, the only difference is if you have done changes to the script itself.

Connect to Oodikone:
`ssh {username}@oodikone.cs.helsinki.fi`

Log in as tkt_oodi
`sudo su - tkt_oodi`

To run the with every student number:

`docker exec -it backend npm run update_database` (or `docker exec -it staging_backend npm run update_database`)

To run the updater for a specific group of students:

Navigate to correct folder
`cd oodikone.cs.helsinki.fi` (or `cd oodikone.cs.helsinki.fi/staging`)

Create a text file with the name 'student_numbers' with the wanted student numbers seperated by line break.

Run:
`./student_numbers_update.sh`
