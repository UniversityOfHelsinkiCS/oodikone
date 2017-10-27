# oodikone2-backend

## Dev

### Getting started

Install postgresql:
https://www.postgresql.org/download/

Then create user tkt_oodi and database tk_oodi from dump.sql file.

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

and enter the pw.

Then install and run redis.
TODO

### Running 
