#!/usr/bin/env bash

# This script is used to setup oodikone with interactive cli. Base for script:
# https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Try to define the script’s location directory
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

# Source common config
source "$script_dir"/common_config.sh

# Set up constants

## Folders
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
DUMP_DIR="$PROJECT_ROOT/.databasedumps"
USER_DATA_FILE="$DUMP_DIR/hyuserdata"
ANON_DUMP_DIR="$DUMP_DIR/anon"
REAL_DUMP_DIR="$DUMP_DIR/real"

## Following the naming convention in docker-compose, these are names for services
## and for the anonymous database. Real databases have suffix "-real".
ANALYTICS_DB_NAME="analytics-db"
KONE_DB_NAME="kone-db"
SIS_DB_NAME="sis-db"
SIS_IMPORTER_DB_NAME="sis-importer-db"
USER_DB_NAME="user-db"
DATABASES=("$ANALYTICS_DB_NAME" "$KONE_DB_NAME" "$SIS_DB_NAME" "$SIS_IMPORTER_DB_NAME" "$USER_DB_NAME")
OODI_DB_NAME="oodi-db" # TODO: Remove when oodi is removed

## Urls should be in same order as databases
ANON_DUMPS_GIT_URL="git@github.com:UniversityOfHelsinkiCS/anonyymioodi.git"
ANALYTICS_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-analytics-pg.sqz"
KONE_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-kone-pg.sqz"
SIS_DB_REAL_DUMP_URL="svm-96.cs.helsinki.fi:/home/updater_user/backups/latest-sis.sqz"
SIS_IMPORTER_DB_REAL_DUMP_URL="importer:/home/importer_user/importer-db/backup/importer-db.sqz"
USER_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-user-pg.sqz"
REAL_DUMP_URLS=("$ANALYTICS_DB_REAL_DUMP_URL" "$KONE_DB_REAL_DUMP_URL" "$SIS_DB_REAL_DUMP_URL"
      "$SIS_IMPORTER_DB_REAL_DUMP_URL" "$USER_DB_REAL_DUMP_URL")
OODI_DB_REAL_DUMP_URL="svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/latest-pg.sqz" # TODO: Remove when oodi is removed

# Run docker-compose down on cleanup
cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  warningmsg "Trying to run docker-compose down and remove orphans"
  docker-compose down --remove-orphans
}

# === CLI options ===

draw_mopo() {
  if [ "$(tput cols)" -gt "100" ]; then
    echo
    cat "$script_dir"/assets/mopo.txt
    echo
  fi
}

retry () {
  for i in {1..60}; do
    "$@" && break || warningmsg "Retry attempt $i failed, waiting..." && sleep 10;
  done
}

download_real_dump() {
  local database=$1
  local pannu_url=$2
  local dump_destination="$REAL_DUMP_DIR/$database.sqz"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" "$username@$pannu_url" "$dump_destination"
}

### REWRITE THESE TO USE MESSAGES

restore_psql_from_backup() {
  infomsg "Restoring database from backup $1 to container $2:"
  infomsg "  1. Copying dump..."
  docker cp "$1" "$2:/asd.sqz"
  infomsg "  2. Writing database..."
  docker exec "$2" pg_restore -U postgres --no-owner -F c --dbname="$3" -j4 /asd.sqz
}

ping_psql() {
  drop_psql "$1" "$2"
  infomsg "Creating psql in container $1 with db name $2"
  retry docker exec -u postgres "$1" pg_isready --dbname="$2"
  docker exec -u postgres "$1" createdb "$2" || warningmsg "container $1 DB $2 already exists"
}

drop_psql() {
  infomsg "Dropping psql in container $1 with db name $2"
  retry docker exec -u postgres "$1" pg_isready --dbname="$2"
  docker exec -u postgres "$1" dropdb "$2" || warningmsg "container $1 DB $2 does not exist"
}

reset_all_anonymous_data() {
  infomsg "Downloading anonymous dumps"
  rm -rf "$ANON_DUMP_DIR" && git clone "$ANON_DUMPS_GIT_URL" "$ANON_DUMP_DIR" \
  && cd "$ANON_DUMP_DIR" || return 1

  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."
  docker-compose down
  docker-compose up -d ${DATABASES[*]}

  for database in "${DATABASES[@]}"; do
    ping_psql "$database" "$database"
    restore_psql_from_backup "$database.sqz" "$database" "$database"
  done

  successmsg "Database setup finished"
}

reset_all_real_data() {
  infomsg "Downloading real data dumps, asking for pannu password when needed"
  for i in ${!DATABASES[*]}; do
    download_real_dump ${DATABASES[$i]} ${REAL_DUMP_URLS[$i]}
  done

  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  docker-compose down
  docker-compose up -d ${DATABASES[*]}

  for database in "${DATABASES[@]}"; do
    ping_psql "$database" "$database"
    restore_psql_from_backup "$database.sqz" "$database" "$database-real"
  done

  successmsg "Database setup finished"
}

reset_sis_importer_data() {
  infomsg "Downloading sis-importer-db dump"
  download_real_dump $SIS_IMPORTER_DB_NAME $SIS_IMPORTER_DB_REAL_DUMP_URL
  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  local database=$SIS_IMPORTER_DB_NAME
  docker-compose down
  docker-compose up -d $database

  ping_psql "$database" "$database"
  restore_psql_from_backup "$database.sqz" "$database" "$database-real"
  successmsg "Database setup finished"
}

reset_old_oodi_data() {
  infomsg "Downloading old oodi-db dump"
  download_real_dump $OODI_DB_NAME $OODI_DB_REAL_DUMP_URL
  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  local database=$OODI_DB_NAME
  docker-compose down
  docker-compose up -d $database

  ping_psql "$database" "$database"
  restore_psql_from_backup "$database.sqz" "$database" "$database-real"
  successmsg "Database setup finished"
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

init_dirs() {
  if [[ ! -d "$DUMP_DIR/real" ]]; then
    msg "${BLUE}Creating directory for dumps and giving read rights for docker script${NOFORMAT}
    "
    mkdir -p "$DUMP_DIR/real"
    chmod -R g+r scripts/docker-entrypoint-initdb.d
  fi
}

# If username is not set, get username from data file.
# Ask user to provide username, if username was not found from data file.
get_username() {
  if [ ! -f "$USER_DATA_FILE" ]; then
    msg "${ORANGE}University username is needed to get database dumps from toska servers, please enter it now:${NOFORMAT}"
    read -r username
    echo "$username" > "$USER_DATA_FILE"
    msg "${GREEN}Succesfully saved username for later usage.${NOFORMAT}"
  fi
  username=$(head -n 1 < "$USER_DATA_FILE")

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
init_dirs
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

