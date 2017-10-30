# oodikone2-backend

## Dev

### Getting started

Install postgresql:
https://www.postgresql.org/download/

Then create user tkt_oodi and database tk_oodi from dump.sql file by following these steps: 

Run:

`psql postgres`

After this you should be working as:

`postgres=#` 

Then run the following commands: 

```
CREATE USER tkt_oodi WITH PASSWORD 'insertPasswordHere';
CREATE DATABASE tkt_oodi;
GRANT ALL PRIVILEGES ON DATABASE tkt_oodi TO tkt_oodi;

\q
```
Now put the dump data to the tkt_oodi db: 

`psql tkt_oodi < dump.sq`

And the db has been set up.

To look into the tkt_oodi db in terminal run:

`psql -h 127.0.0.1 -d tkt_oodi -U tkt_oodi -W`

and enter the password.

Then install and run redis
https://redis.io/topics/quickstart

Install nodejs and npm
https://nodejs.org/en/download/

Run in the root of the project:

`npm install`

### Running 

Run `npm start`

Check in your browser for

http://localhost:8080/ping

And if you see "pong" you can congratulate yourself on succesfully installing OodiKone2 backend.
