#!/usr/bin/env bash

# This script is used to setup oodikone with interactive cli. Base for script:
# https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Try to define the script’s location directory
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

# Source common config
source "$script_dir/common_config.sh"

# Set up constants
PROJECT_ROOT=$(git rev-parse --show-toplevel)
USER_DATA_FILE_PATH="$PROJECT_ROOT/hyuserdata"
BACKUP_DIR="$PROJECT_ROOT/backups"
PSQL_REAL_DB_BACKUP="$BACKUP_DIR/latest-pg.sqz"
KONE_REAL_DB_BACKUP="$BACKUP_DIR/latest-kone-pg.sqz"
USER_REAL_DB_BACKUP="$BACKUP_DIR/latest-user-pg.sqz"
ANALYTICS_REAL_DB_BACKUP="$BACKUP_DIR/latest-analytics-pg.sqz"
SIS_REAL_DB_BACKUP="$BACKUP_DIR/latest-sis.sqz"

# If username is not set, get username from data file.
# Ask user to provide username, if username was not found from data file.
get_username() {
  [[ -z "${username-}" ]] || return 0

  if [ ! -f "$USER_DATA_FILE_PATH" ]; then
    msg "${BLUE}No previous username data found, please enter your Uni Helsinki username:${NOFORMAT}"
    read -r username
    echo "$username" > "$USER_DATA_FILE_PATH"
    msg "${GREEN}Succesfully saved username${NOFORMAT}"
  fi

  username=$(head -n 1 < "$USER_DATA_FILE_PATH")
}

# Retry given command
retry () {
  for i in {1..60}; do
    "$@" && break || msg "${ORANGE}Retry attempt $i failed, waiting for 10 seconds...${NOFORMAT}" && sleep 10;
  done
}


### REWRITE BELOW

restore_psql_from_backup () {
    echo ""
    echo "Restoring database from backup $1 to container $2:"
    echo "  1. Copying dump..."
    docker cp "$1" "$2:/asd.sqz"
    echo "  2. Writing database..."
    docker exec "$2" pg_restore -U postgres --no-owner -F c --dbname="$3" -j4 /asd.sqz
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
    restore_psql_from_backup "$KONE_REAL_DB_BACKUP" db_kone db_kone_real
    ping_psql "oodi_user_db" "user_db_real"
    restore_psql_from_backup "$USER_REAL_DB_BACKUP" oodi_user_db user_db_real
    ping_psql "oodi_analytics_db" "analytics_db_real"
    restore_psql_from_backup "$ANALYTICS_REAL_DB_BACKUP" oodi_analytics_db analytics_db_real
    ping_psql "db_sis" "db_sis_real"
    restore_psql_from_backup "$SIS_REAL_DB_BACKUP" db_sis db_sis_real
    ping_psql "sis-importer-db" "importer-db"
    restore_psql_from_backup "$BACKUP_DIR/importer-db.sqz" sis-importer-db importer-db

    echo "Database setup finished"

    docker-compose-dev down
}

install_local_npm_packages () {
    # These are required for linting and only installed if not already there
    [[ -d node_modules ]] || npm ci
    cd services/oodikone2-frontend || return
    [[ -d node_modules ]] || npm ci
    cd ../oodikone2-analytics || return
    [[ -d node_modules ]] || npm ci
    cd ../oodikone2-userservice || return
    [[ -d node_modules ]] || npm ci
    cd ../backend/oodikone2-backend || return
    [[ -d node_modules ]] || npm ci
    cd ../updater_writer || return
    [[ -d node_modules ]] || npm ci

    cd ../../../
}

init_dirs () {
  mkdir -p "$BACKUP_DIR"
  chmod -R g+r scripts/docker-entrypoint-initdb.d
}

# Set up oodikone with real data
run_full_setup () {
    echo "=== Setting up npm packages locally ==="
    install_local_npm_packages
    echo "=== Creating directories and ensuring rights are correct ==="
    init_dirs
    echo "=== Setting up needed databases ==="
    run_full_real_data_reset
    echo "=== Building images ==="
    docker-compose-dev build
    echo "=== Starting oodikone ==="
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

    return 0
    echo "Downloading oodi-db dump"
    scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
    "$username@svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/*" "$BACKUP_DIR/"

    docker-compose-dev down
    docker-compose-dev up -d db

    echo "Restoring PostgreSQL from backup. This might take a while."

    ping_psql "oodi_db" "tkt_oodi_real"
    restore_psql_from_backup "$PSQL_REAL_DB_BACKUP" oodi_db tkt_oodi_real

    echo "Database setup finished"

    docker-compose-dev down
}

# === Run cli ===


mopo () {
    if [ "$(tput cols)" -gt "100" ]; then
        cat scripts/assets/mopo2.txt
    fi
}

logo () {
    if [ "$(tput cols)" -gt "76" ]; then
        cat scripts/assets/logo.txt
    fi
}

PS3='Please enter your choice: '

logo
cat scripts/assets/welcome.txt

options=(
    "Set up oodikone with real data."
    "Download & reset all real data."
    "Download & reset sis importer data."
    "Download & reset old oodi data."
    "Quit."
)

while true; do
    select opt in "${options[@]}"; do
        case $opt in
            "Set up oodikone with real data.")
                mopo
                run_full_setup
                ;;
            "Download & reset all real data.")
                run_full_real_data_reset
                ;;
            "Download & reset sis importer data.")
                run_importer_data_reset
                ;;
            "Download & reset old oodi data.")
                run_oodi_data_reset
                ;;
            "Quit.")
                break 2
                ;;
            *) echo "Invalid option $REPLY";;
        esac
        break
    done
done
