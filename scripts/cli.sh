#!/usr/bin/env bash

# This script is used to setup oodikone with interactive cli. Base for script:
# https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Try to define the script’s location directory
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

# Source common config
source "$script_dir"/common_config.sh

# Set up constants
PROJECT_ROOT=$(git rev-parse --show-toplevel)
USER_DATA_FILE_PATH="$PROJECT_ROOT/hyuserdata"
BACKUP_DIR="$PROJECT_ROOT/backups"
PSQL_REAL_DB_BACKUP="$BACKUP_DIR/latest-pg.sqz"
KONE_REAL_DB_BACKUP="$BACKUP_DIR/latest-kone-pg.sqz"
USER_REAL_DB_BACKUP="$BACKUP_DIR/latest-user-pg.sqz"
ANALYTICS_REAL_DB_BACKUP="$BACKUP_DIR/latest-analytics-pg.sqz"
SIS_REAL_DB_BACKUP="$BACKUP_DIR/latest-sis-pg.sqz"
ANONYYMIOODI_URL="git@github.com:UniversityOfHelsinkiCS/anonyymioodi.git"
ANONYYMIOODI_FOLDER="$PROJECT_ROOT/anonyymioodi"

# Run docker-compose down on cleanup
cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  msg "
${ORANGE}Trying to run docker-compose down and remove orphans${NOFORMAT}
"
  docker-compose down --remove-orphans
}

# === CLI options ===

### REWRITE THESE TO USE MESSAGES

retry () {
  for i in {1..60}; do
    "$@" && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
  done
}

restore_psql_from_backup() {
    echo "Restoring database from backup $1 to container $2:"
    echo "  1. Copying dump..."
    docker cp "$1" "$2:/asd.sqz"
    echo "  2. Writing database..."
    docker exec "$2" pg_restore -U postgres --no-owner -F c --dbname="$3" -j4 /asd.sqz
}

ping_psql() {
    drop_psql "$1" "$2"
    echo "Creating psql in container $1 with db name $2"
    retry docker exec -u postgres "$1" pg_isready --dbname="$2"
    docker exec -u postgres "$1" createdb "$2" || echo "container $1 DB $2 already exists"
}

drop_psql() {
    echo "Dropping psql in container $1 with db name $2"
    retry docker exec -u postgres "$1" pg_isready --dbname="$2"
    docker exec -u postgres "$1" dropdb "$2" || echo "container $1 DB $2 does not exist"
}

draw_mopo() {
  if [ "$(tput cols)" -gt "100" ]; then
    echo
    cat "$script_dir"/assets/mopo.txt
    echo
  fi
}

reset_all_anonymous_data() {
  msg "${BLUE}Downloading anonymous dumps${NOFORMAT}"
  rm -rf "$ANONYYMIOODI_FOLDER" && git clone "$ANONYYMIOODI_URL" "$ANONYYMIOODI_FOLDER" \
  && cd "$ANONYYMIOODI_FOLDER" || return 1

  msg "${BLUE}Restoring PostgreSQL dumps from backups. This might take a while.${NOFORMAT}"
  docker-compose down
  docker-compose up -d user_db db_kone analytics_db db_sis sis-importer-db

  ping_psql "db_kone" "db_kone"
  restore_psql_from_backup db_kone.sqz db_kone db_kone
  ping_psql "oodi_user_db" "user_db"
  restore_psql_from_backup user_db.sqz oodi_user_db user_db
  ping_psql "oodi_analytics_db" "analytics_db"
  restore_psql_from_backup analytics_db.sqz oodi_analytics_db analytics_db
  ping_psql "db_sis" "db_sis"
  restore_psql_from_backup db_sis.sqz db_sis db_sis
  ping_psql "sis-importer-db" "importer-db"
  restore_psql_from_backup importer-db.sqz sis-importer-db importer-db

  msg "${GREEN}Database setup finished.${NOFORMAT}"
}

reset_all_real_data() {
  msg "${BLUE}Downloading user-db, analytics-db and kone-db dumps${NOFORMAT}"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
"$username@oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/*" "$BACKUP_DIR/"

  msg "${BLUE}Downloading sis-db dump${NOFORMAT}"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
"$username@svm-96.cs.helsinki.fi:/home/updater_user/backups/*" "$BACKUP_DIR/"

  msg "${BLUE}Downloading importer-db dump${NOFORMAT}"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
"$username@importer:/home/importer_user/importer-db/backup/importer-db.sqz" "$BACKUP_DIR/"

  msg "${BLUE}Restoring PostgreSQL dumps from backups. This might take a while.${NOFORMAT}"

  docker-compose down
  docker-compose up -d user_db db_kone analytics_db db_sis sis-importer-db
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

  msg "${GREEN}Database setup finished.${NOFORMAT}"
}

reset_sis_importer_data() {
  msg "${BLUE}Downloading importer-db dump${NOFORMAT}"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
"$username@importer:/home/importer_user/importer-db/backup/importer-db.sqz" "$BACKUP_DIR/"

  msg "${BLUE}Restoring PostgreSQL dumps from backups. This might take a while.${NOFORMAT}"

  docker-compose down
  docker-compose up -d sis-importer-db
  ping_psql "sis-importer-db" "importer-db"
  restore_psql_from_backup "$BACKUP_DIR/importer-db.sqz" sis-importer-db importer-db

  msg "${GREEN}Database setup finished.${NOFORMAT}"
}

reset_old_oodi_data() {
  echo "Downloading old oodi-db dump"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" \
"$username@svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/*" "$BACKUP_DIR/"

  docker-compose down
  docker-compose up -d db

  msg "${BLUE}Restoring PostgreSQL dumps from backups. This might take a while.${NOFORMAT}"

  ping_psql "oodi_db" "tkt_oodi_real"
  restore_psql_from_backup "$PSQL_REAL_DB_BACKUP" oodi_db tkt_oodi_real

  msg "${GREEN}Database setup finished.${NOFORMAT}"
}

set_up_oodikone() {
  draw_mopo

  msg "${BLUE}Installing npm packages locally to enable linting${NOFORMAT}
  "
  folders_to_set_up=(
    "$PROJECT_ROOT"
    "$PROJECT_ROOT/services/oodikone2-analytics"
    "$PROJECT_ROOT/services/oodikone2-frontend"
    "$PROJECT_ROOT/services/oodikone2-userservice"
    "$PROJECT_ROOT/services/backend/oodikone2-backend"
  )

  for folder in "${folders_to_set_up[@]}"; do
    cd "$folder" || return 1
    ([[ -d node_modules ]] && msg "${GREEN}Packages already installed in $folder${NOFORMAT}") || npm ci
  done
  cd "$PROJECT_ROOT" || return 1

  msg "${BLUE}Initializing needed directories and correct rights${NOFORMAT}
  "

  mkdir -p "$BACKUP_DIR"
  chmod -R g+r scripts/docker-entrypoint-initdb.d

  msg "${BLUE}Setting up databases with anonymous data.${NOFORMAT}
  "
  reset_all_anonymous_data

  msg "${BLUE}Building images.${NOFORMAT}
  "
  docker-compose build

  msg "${GREEN}Setup ready, oodikone can be started! See README for more info.${NOFORMAT}
  "
}

# === CLI ===

show_welcome() {
  if [ "$(tput cols)" -gt "76" ]; then
    cat "$script_dir"/assets/logo.txt
  fi
  msg "${BLUE}Welcome to Oodikone CLI!${NOFORMAT}

This tool helps you in managing the project configuration. If you are new to
Oodikone development, you should probably run \"Set up oodikone\" which will
take care of setting up and starting Oodikone for you. See README for more
details.
"
}

# If username is not set, get username from data file.
# Ask user to provide username, if username was not found from data file.
get_username() {
  if [ ! -f "$USER_DATA_FILE_PATH" ]; then
    msg "${ORANGE}University username is needed to get database dumps from toska servers, please enter it now:${NOFORMAT}"
    read -r username
    echo "$username" > "$USER_DATA_FILE_PATH"
    msg "${GREEN}Succesfully saved username for later usage.${NOFORMAT}"
  fi
  username=$(head -n 1 < "$USER_DATA_FILE_PATH")

  msg "${BLUE}Using your university username ${PURPLE}${username}${BLUE} for \
getting database dumps.${NOFORMAT}
"
}

# Define custom shell prompt for the interactive select loop
PS3="Please enter your choice: "

options=(
  "Set up oodikone."
  "Reset all anonymous data."
  "Reset all real data."
  "Reset sis-importer data."
  "Reset old oodi data."
  "Quit."
)

show_welcome
get_username

while true; do
  select opt in "${options[@]}"; do
    case $opt in
      "Set up oodikone.")
        set_up_oodikone;;
      "Reset all anonymous data.")
        reset_all_anonymous_data;;
      "Reset all real data.")
        reset_all_real_data;;
      "Reset sis-importer data.")
        reset_sis_importer_data;;
      "Reset old oodi data.")
        reset_old_oodi_data;;
      "Quit.")
        break 2;;
      *) msg "${RED}Invalid option:${NOFORMAT} $REPLY
";;
    esac
    break
  done
done

