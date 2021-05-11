#!/bin/bash

DIR_PATH=$(dirname "$0")
USER_DATA_FILE_PATH="hyuserdata"
ANONDB_DIR=anonyymioodi
BACKUP_DIR=backups

PSQL_DB_BACKUP="$ANONDB_DIR/anon.sqz"
USER_DB_BACKUP="$ANONDB_DIR/user-dump.sqz"
KONE_DB_BACKUP="$ANONDB_DIR/anon_kone.sqz"
ANALYTICS_DB_BACKUP="$ANONDB_DIR/analytics-dump.sqz"

PSQL_REAL_DB_BACKUP="$BACKUP_DIR/latest-pg.sqz"
KONE_REAL_DB_BACKUP="$BACKUP_DIR/latest-kone-pg.sqz"
USER_REAL_DB_BACKUP="$BACKUP_DIR/latest-user-pg.sqz"
ANALYTICS_REAL_DB_BACKUP="$BACKUP_DIR/latest-analytics-pg.sqz"
SIS_REAL_DB_BACKUP="$BACKUP_DIR/latest-sis.sqz"

# Remember username during runtime
username=""

get_username() {
  # Check if username has already been set
  [ -z "$username" ]|| return 0

  # Check if username is saved to data file and ask it if not
  if [ ! -f "$USER_DATA_FILE_PATH" ]; then
    echo ""
    echo "!! No previous username data found. Will ask it now !!"
    echo "Enter your Uni Helsinki username:"
    read username
    echo $username > $USER_DATA_FILE_PATH
    echo "Succesfully saved username"
    echo ""
  fi

  # Set username
  username=$(cat $USER_DATA_FILE_PATH | head -n 1)
}

docker-compose-dev () {
    npm run docker:oodikone:dev -- "$@"
}

retry () {
    for i in {1..60}
    do
        $@ && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
    done
}

init_dirs () {
    mkdir -p $BACKUP_DIR nginx nginx/cache nginx/letsencrypt
    touch nginx/error.log
    touch nginx/log
}

echo_path () {
    echo $(pwd)
}

get_oodikone_server_backup() {
    get_username
    echo "Using your Uni Helsinki username: $username"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@svm-96.cs.helsinki.fi:/home/updater_user/backups/* "$BACKUP_DIR/"
}

get_anon_oodikone() {
    rm -rf anonyymioodi
    git clone --depth=1 git@github.com:UniversityOfHelsinkiCS/anonyymioodi.git
}

restore_psql_from_backup () {
    echo ""
    echo "Restoring database from backup ($1/$2):"
    echo "  1. Copying dump..."
    docker cp $1 $2:/asd.sqz
    echo "  2. Writing database..."
    docker exec $2 pg_restore -U postgres --no-owner -F c --dbname=$3 -j4 /asd.sqz
}

ping_psql () {
    drop_psql $1 $2
    echo "Creating psql in container $1 with db name $2"
    retry docker exec -u postgres $1 pg_isready --dbname=$2
    #docker exec -u postgres $1 psql -c "CREATE DATABASE $2" || echo "container $1 DB $2 already exists"
    docker exec -u postgres $1 createdb $2 || echo "container $1 DB $2 already exists"
}

drop_psql () {
    echo "Dropping psql in container $1 with db name $2"
    retry docker exec -u postgres $1 pg_isready --dbname=$2
    #docker exec -u postgres $1 psql -c "DROP DATABASE $2" || echo "container $1 DB $2 doesn't exists"
    docker exec -u postgres $1 dropdb $2 || echo "container $1 DB $2 does not exist"
}

db_setup_full () {
    echo "Restoring PostgreSQL from backup"
    ping_psql "oodi_db" "tkt_oodi_real"
    restore_psql_from_backup $PSQL_REAL_DB_BACKUP oodi_db tkt_oodi_real
    ping_psql "db_kone" "db_kone_real"
    restore_psql_from_backup $KONE_REAL_DB_BACKUP db_kone db_kone_real
    ping_psql "oodi_user_db" "user_db_real"
    restore_psql_from_backup $USER_REAL_DB_BACKUP oodi_user_db user_db_real
    ping_psql "oodi_analytics_db" "analytics_db_real"
    restore_psql_from_backup $ANALYTICS_REAL_DB_BACKUP oodi_analytics_db analytics_db_real
    ping_psql "db_sis" "db_sis_real"
    restore_psql_from_backup $SIS_REAL_DB_BACKUP db_sis db_sis_real
    echo "Database setup finished"
}

run_importer_setup () {
    get_username
    echo "Using your Uni Helsinki username: $username"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@importer:/home/importer_user/importer-db/backup/importer-db.sqz "$BACKUP_DIR/"
    docker-compose -f dco.data.yml up -d sis-importer-db
    ping_psql "sis-importer-db" "importer-db"
    restore_psql_from_backup "$BACKUP_DIR/importer-db.sqz" sis-importer-db importer-db
    docker-compose -f dco.data.yml down
}

run_full_real_data_reset () {
    get_username
    echo "Using your Uni Helsinki username: $username"

    echo "Downloading oodikone database dumps"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"

    echo "Downloading oodi-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"

    echo "Downloading sis-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@svm-96.cs.helsinki.fi:/home/updater_user/backups/* "$BACKUP_DIR/"

    echo "Downloading importer-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" $username@importer:/home/importer_user/importer-db/backup/importer-db.sqz "$BACKUP_DIR/"

    docker-compose-dev down
    docker-compose-dev up -d db user_db db_kone analytics_db db_sis sis-importer-db
    
    echo "Restoring PostgreSQL from backup. This might take a while."
    ping_psql "oodi_db" "tkt_oodi_real"
    restore_psql_from_backup $PSQL_REAL_DB_BACKUP oodi_db tkt_oodi_real
    ping_psql "db_kone" "db_kone_real"
    restore_psql_from_backup $KONE_REAL_DB_BACKUP db_kone db_kone_real
    ping_psql "oodi_user_db" "user_db_real"
    restore_psql_from_backup $USER_REAL_DB_BACKUP oodi_user_db user_db_real
    ping_psql "oodi_analytics_db" "analytics_db_real"
    restore_psql_from_backup $ANALYTICS_REAL_DB_BACKUP oodi_analytics_db analytics_db_real
    ping_psql "db_sis" "db_sis_real"
    restore_psql_from_backup $SIS_REAL_DB_BACKUP db_sis db_sis_real
    ping_psql "sis-importer-db" "importer-db"
    restore_psql_from_backup "$BACKUP_DIR/importer-db.sqz" sis-importer-db importer-db
    echo "Database setup finished"

    docker-compose-dev down
}

db_anon_setup_full () {
    echo "Restoring PostgreSQL from backup"
    
    ping_psql "oodi_db" "tkt_oodi"
    ping_psql "oodi_db" "tkt_oodi_test"
    restore_psql_from_backup $PSQL_DB_BACKUP oodi_db tkt_oodi

    ping_psql "db_kone" "db_kone"
    ping_psql "db_kone" "db_kone_test"
    restore_psql_from_backup $KONE_DB_BACKUP db_kone db_kone

    ping_psql "oodi_user_db" "user_db"
    restore_psql_from_backup $USER_DB_BACKUP oodi_user_db user_db

    ping_psql "oodi_analytics_db" "analytics_db"
    restore_psql_from_backup $ANALYTICS_DB_BACKUP oodi_analytics_db analytics_db

    echo "Database setup finished"
}

reset_real_db () {
    docker-compose-dev down
    docker-compose-dev up -d db user_db db_kone analytics_db db_sis
    db_setup_full
    docker-compose-dev down
}

reset_db () {
    docker-compose-dev down
    docker-compose-dev up -d db user_db db_kone analytics_db db_sis
    db_anon_setup_full
    docker-compose-dev down
}

reset_db_for_cypress () {
    # stop any service with connections to DB
    docker-compose stop backend updater_writer
    db_anon_setup_full
    # restart services, run migrations
    docker-compose restart backend updater_writer
    # wait until backend is up
    retry curl --silent --fail localhost:8080/ping
}

install_local_npm_packages () {
    npm ci

    # The rest is required for linting to work.
    cd services/oodikone2-frontend
    npm ci
    cd ../oodikone2-analytics
    npm ci
    cd ../oodikone2-userservice
    npm ci
    cd ../backend/oodikone2-backend
    npm ci
    cd ../updater_writer
    npm ci

    cd ../../../
}

show_instructions () {
    cat scripts/assets/instructions.txt
}

run_full_setup () {
    echo "Setup npm packages"
    install_local_npm_packages
    echo "Init dirs"
    init_dirs
    echo "Getting backups from the Oodikone server, this will prompt you for your password. "
    get_oodikone_server_backup
    echo "Getting anon backups from the private repository. "
    get_anon_oodikone
    echo "Building images"
    docker-compose-dev build
    echo "Setup oodikone db from dump."
    docker-compose-dev up -d db user_db db_kone analytics_db db_sis
    db_setup_full
    db_anon_setup_full
    docker-compose-dev down
    npm run docker:up:real
    show_instructions
}

run_anon_full_setup () {
    echo "Setup npm packages"
    install_local_npm_packages
    echo "Init dirs"
    init_dirs
    echo "Getting anon backups from the private repository. "

    if get_anon_oodikone ; then
        echo "Anon data fetched"
    else
        anon_data_error="Could not fetch anonyymioodi. Fetch the latest data with the CLI before running oodikone"
    fi
    
    echo "Building images"
    docker-compose-dev build
    echo "Setup oodikone db from dump."
    docker-compose-dev up -d db user_db db_kone analytics_db
    db_anon_setup_full
    docker-compose-dev down
    npm run docker:up
    show_instructions
    if [[ ! -z anon_data_error ]] ; then
        tput setaf 1; echo "$anon_data_error"; tput sgr0
    fi
}
