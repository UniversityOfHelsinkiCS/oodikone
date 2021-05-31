#!/bin/bash

# Constant filenames and paths used in scripts
USER_DATA_FILE_PATH="hyuserdata"
BACKUP_DIR=backups

PSQL_REAL_DB_BACKUP="$BACKUP_DIR/latest-pg.sqz"
KONE_REAL_DB_BACKUP="$BACKUP_DIR/latest-kone-pg.sqz"
USER_REAL_DB_BACKUP="$BACKUP_DIR/latest-user-pg.sqz"
ANALYTICS_REAL_DB_BACKUP="$BACKUP_DIR/latest-analytics-pg.sqz"
SIS_REAL_DB_BACKUP="$BACKUP_DIR/latest-sis.sqz"

# Remember username during runtime
username=""

### === GENERIC HELPER FUNCTIONS ===

get_username() {
  # Check if username has already been set
  [ -z "$username" ]|| return 0

  # Check if username is saved to data file and ask it if not
  if [ ! -f "$USER_DATA_FILE_PATH" ]; then
    echo ""
    echo "!! No previous username data found. Will ask it now !!"
    echo "Enter your Uni Helsinki username:"
    read -r username
    echo "$username" > "$USER_DATA_FILE_PATH"
    echo "Succesfully saved username"
    echo ""
  fi

  # Set username
  username=$(head -n 1 < $USER_DATA_FILE_PATH)
}

retry () {
  for i in {1..60}; do
    "$@" && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
  done
}

docker-compose-dev () {
    npm run docker:oodikone:dev -- "$@"
}

### === PSQL HELPER FUNCTIONS ===

restore_psql_from_backup () {
    echo ""
    echo "Restoring database from backup ($1/$2):"
    echo "  1. Copying dump..."
    docker cp "$1" "$2:/asd.sqz"
    echo "  2. Writing database..."
    docker exec "$2" pg_restore -U postgres --no-owner -F c --dbname="$3 -j4 /asd.sqz"
}

ping_psql () {
    drop_psql "$1" "$2"
    echo "Creating psql in container $1 with db name $2"
    retry docker exec -u postgres "$1" pg_isready --dbname="$2"
    docker exec -u postgres "$1" createdb "$2" || echo "container $1 DB $2 already exists"
}

drop_psql () {
    echo "Dropping psql in container $1 with db name $2"
    retry docker exec -u postgres "$1" pg_isready --dbname="$2"
    docker exec -u postgres "$1" dropdb "$2" || echo "container $1 DB $2 does not exist"
}

### === FUNCTIONS TO RUN CLI OPTIONS ===

# Download & reset all real data
run_full_real_data_reset () {
    get_username
    echo "Using your Uni Helsinki username: $username"

    echo "Downloading user-db, analytics-db and kone-db dumps"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/*" "$BACKUP_DIR/"

    echo "Downloading sis-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@svm-96.cs.helsinki.fi:/home/updater_user/backups/*" "$BACKUP_DIR/"

    echo "Downloading importer-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@importer:/home/importer_user/importer-db/backup/importer-db.sqz" "$BACKUP_DIR/"

    docker-compose-dev down
    docker-compose-dev up -d user_db db_kone analytics_db db_sis sis-importer-db

    echo "Restoring PostgreSQL from backup. This might take a while."

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

install_local_npm_packages () {
    npm ci

    # The rest is required for linting to work.
    cd services/oodikone2-frontend || return
    npm ci
    cd ../oodikone2-analytics || return
    npm ci
    cd ../oodikone2-userservice || return
    npm ci
    cd ../backend/oodikone2-backend || return
    npm ci
    cd ../updater_writer || return
    npm ci

    cd ../../../
}

# Set up oodikone with real data
run_full_setup () {
    echo "Setup npm packages"
    install_local_npm_packages
    echo "Create needed directories and ensure directories have correct rights"
    mkdir -p $BACKUP_DIR
    chmod 755 scripts/docker-entrypoint-initdb.d
    echo "Setting up needed databases"
    run_full_real_data_reset
    echo "Building images"
    docker-compose-dev build
    npm run docker:up:real
    cat scripts/assets/instructions.txt
}

# Download & reset sis importer data
run_importer_data_reset() {
    get_username
    echo "Using your Uni Helsinki username: $username"

    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@importer:/home/importer_user/importer-db/backup/importer-db.sqz" "$BACKUP_DIR/"

    docker-compose -f dco.data.yml up -d sis-importer-db
    ping_psql "sis-importer-db" "importer-db"
    restore_psql_from_backup "$BACKUP_DIR/importer-db.sqz" sis-importer-db importer-db
    docker-compose -f dco.data.yml down
}

# Download & reset old oodi data
run_oodi_data_reset () {
    get_username
    echo "Using your Uni Helsinki username: $username"

    echo "Downloading oodi-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/*" "$BACKUP_DIR/"

    docker-compose-dev down
    docker-compose-dev up -d db

    echo "Restoring PostgreSQL from backup. This might take a while."

    ping_psql "oodi_db" "tkt_oodi_real"
    restore_psql_from_backup $PSQL_REAL_DB_BACKUP oodi_db tkt_oodi_real

    echo "Database setup finished"

    docker-compose-dev down
}
