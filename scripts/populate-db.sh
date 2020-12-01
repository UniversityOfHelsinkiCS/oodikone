#!/bin/bash
set -e

DIR_PATH=$(dirname $(dirname "$0"))
SERVICES=(db_sis db)
BACKUPS=$DIR_PATH/backups

# DB SIS CONFIG
DB_SIS=db_sis
DB_SIS_CONTAINER=db_sis
DB_SIS_BACKUP="$BACKUPS/sis-updater-staging.sqz"
DB_SIS_ARGS="$DB_SIS $DB_SIS_CONTAINER $DB_SIS_BACKUP"

# ANON DB CONFIG
DB_ANON=tkt_oodi
DB_ANON_CONTAINER=oodi_db
DB_ANON_BACKUP="$BACKUPS/demo-anon-staging.sqz"
DB_ANON_ARGS="$DB_ANON $DB_ANON_CONTAINER $DB_ANON_BACKUP"

retry () {
    for i in {1..60}
    do
        $@ && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
    done
}

drop_create_populate () {
    DB=$1
    CONTAINER=$2
    BACKUP=$3

    echo "Dropping $DB"
    retry docker exec -u postgres $CONTAINER pg_isready --dbname=$DB
    docker exec -u postgres $CONTAINER psql -c "DROP DATABASE \"$DB\"" || echo "container $CONTAINER DB $DB doesn't exists"

    echo "Creating $DB"
    retry docker exec -u postgres $CONTAINER pg_isready --dbname=$DB
    docker exec -u postgres $CONTAINER psql -c "CREATE DATABASE \"$DB\"" || echo "container $CONTAINER DB $DB already exists"

    echo "Populating $DB"
    docker cp $BACKUP $CONTAINER:/asd.sqz
    docker exec $CONTAINER pg_restore -U postgres --no-owner -F c --dbname="$DB" -j4 /asd.sqz
}

export -f retry
export -f drop_create_populate
mkdir -p backups


echo "Enter your Uni Helsinki username:"
read username
echo "Fetching latest staging SIS data & OODI demo data"
scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkinpaasi.cs.helsinki.fi" $username@oodikone-staging:/home/tkt_oodi/backups/\{sis-updater-staging.sqz,demo-anon-staging.sqz\} $BACKUPS

echo "Setting up services: ${SERVICES[@]}"
npm run docker:down --prefix $DIR_PATH
npm run docker:up --prefix $DIR_PATH -- ${SERVICES[@]}

echo "Populating DB_SIS and DB_ANON"
echo $DB_SIS_ARGS $DB_ANON_ARGS | xargs -n 3 -P 2 bash -c 'drop_create_populate $1 $2 $3' bash

echo "Cleaning up"
npm run docker:down --prefix $DIR_PATH
