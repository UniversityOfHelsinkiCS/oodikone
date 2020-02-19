#!/bin/bash
DIR_PATH=$(dirname $(dirname "$0"))
DB=db_sis
CONTAINER=db_sis
SERVICE=db_sis
BACKUP=$DIR_PATH/backups/sis-updater-staging.sqz

retry () {
    for i in {1..60}
    do
        $@ && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
    done
}

mkdir -p backups

echo "Fetching latest staging backup data"
scp -r -o ProxyCommand="ssh -W %h:%p melkinpaasi.cs.helsinki.fi" oodikone-staging:/home/tkt_oodi/backups/sis-updater-staging.sqz $BACKUP

echo "Setting up db"
npm run docker:down --prefix $DIR_PATH
npm run docker:up --prefix $DIR_PATH -- $SERVICE

echo "Dropping $DB"
retry docker exec -u postgres $CONTAINER pg_isready --dbname=$DB
docker exec -u postgres $CONTAINER psql -c "DROP DATABASE \"$DB\"" || echo "container $CONTAINER DB $DB doesn't exists"

echo "Creating $DB"
retry docker exec -u postgres $CONTAINER pg_isready --dbname=$DB
docker exec -u postgres $CONTAINER psql -c "CREATE DATABASE \"$DB\"" || echo "container $CONTAINER DB $DB already exists"

echo "Populating $DB"
docker cp $BACKUP $CONTAINER:/asd.sqz
docker exec $CONTAINER pg_restore -U postgres --no-owner -F c --dbname="$DB" -j4 /asd.sqz

echo "Cleaning up"
npm run docker:down --prefix $DIR_PATH

