# oodikone2-backend

## Dev

### Getting started

Install postgresql:
https://www.postgresql.org/download/

Then create user tkt_oodi and database tk_oodi from dump.sql file by following these steps: 

Run:

`sudo su postgres`

`psql`
After this you should be working as:

`postgres=#` 

Then contact admin to get the password and run the following commands: 

```
CREATE USER tkt_oodi WITH PASSWORD 'insertPasswordHere';
CREATE DATABASE tkt_oodi;
GRANT ALL PRIVILEGES ON DATABASE tkt_oodi TO tkt_oodi;
\q
```
Now put the dump data to the tkt_oodi db: 

`psql tkt_oodi < dump.sql`

And the db has been set up.

To look into the tkt_oodi db in terminal run:

`psql -h 127.0.0.1 -d tkt_oodi -U tkt_oodi -W`

and enter the password.

Then install and run redis

```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
sudo make install
redis-server
```

Install nodejs and npm
https://nodejs.org/en/download/

Clone the repository and install the packages in the root of the project:

```
git clone git@github.com:UniversityOfHelsinkiCS/oodikone2-backend.git`
cd oodikone2-backend
npm install
```

### Running 

#### Dev

Run `npm run dev`

Check in your browser for

http://localhost:8080/api/tags

If you see a response you can congratulate yourself on succesfully installing and running OodiKone2 backend.

#### Docker
Install docker CE: https://docs.docker.com/engine/installation/ 

Install docker-compose: https://docs.docker.com/compose/install/

Docker-compose version must be > 1.10.0

Build a Docker image using comand 

`docker build -t {username}/backend`

Run the whole OodiKone with the command 

`docker-compose up`

#### Testing

First log in to oodikone and add reading rights to your username to the test data dump

```
ssh {username}@oodikone.cs.helsinki.fi
setfacl -m u:{username}:r /home/oodidata/ooditestdata.sql
```

Return to your own computer and fetch the test data with the command

`scp {username}@oodikone.cs.helsinki.fi:/home/oodidata/ooditestdata.sql .`

Set up the test database from the file

Run:

`sudo su postgres`

`psql`

After this you should be working as:

`postgres=#` 

Run: 

```
CREATE DATABASE tkt_oodi_test;
GRANT ALL PRIVILEGES ON DATABASE tkt_oodi_test TO tkt_oodi;
\q
```
Now put the dump data to the tkt_oodi_test db: 

`psql tkt_oodi_test < ooditestdata.sql`

And you're all set. 

Run the tests with command

`npm test`

## Deployment

Log into svm-59 (aka oodikone) and navigate to the correct folder

`ssh {username}@oodikone.cs.helsinki.fi`

`cd home/oodidata/oodikone2-backend/`

Pull the new version from Git

`git pull`

Use the update script to restart the software

`./update.sh`

Be amazed

## oodiKone-backend1

If you have the original oodikone-backend-1.0-SNAPSHOT.jar file, make sure you have the application.properties file set up at the same folder and the psql database set up as required by the backend2 and you should be able to run the original backend with the command

`java -jar oodikone-backend-1.0-SNAPSHOT.jar`
