# oodikone2-backend

## Dev

### Getting started

Install postgresql:
https://www.postgresql.org/download/

Then create user tkt_oodi and database tk_oodi from dump.sql file by following these steps: 

Run:

`sudo su postgres`

`psql`ä
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

Run `npm start`

Check in your browser for

http://localhost:8080/api/tags

If you see a response you can congratulate yourself on succesfully installing and running OodiKone2 backend.

## oodiKone-backend1

If you have the original oodikone-backend-1.0-SNAPSHOT.jar file, make sure you have the application.properties file set up at the same folder and the psql database set up as required by the backend2 and you should be able to run the original backend with the command

`java -jar oodikone-backend-1.0-SNAPSHOT.jar`
