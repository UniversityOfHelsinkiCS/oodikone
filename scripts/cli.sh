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
REAL_DUMP_URLS=("$ANALYTICS_DB_REAL_DUMP_URL" "$KONE_DB_REAL_DUMP_URL" "$SIS_DB_REAL_DUMP_URL" "$SIS_IMPORTER_DB_REAL_DUMP_URL" "$USER_DB_REAL_DUMP_URL")
OODI_DB_REAL_DUMP_URL="svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/latest-pg.sqz" # TODO: Remove when oodi is removed

# Run docker-compose down on cleanup
cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  warningmsg "Trying to run docker-compose down and remove orphans"
  docker-compose down --remove-orphans
}

# === CLI options ===

draw_mopo() {
  # Some hacks to print mopo as green, since colours from common config don't work
  # Please feel free to fix this. And tell otahontas how you did it!
  local mopogreen=$(tput setaf 34)
  local normal=$(tput sgr0)
  if [ "$(tput cols)" -gt "100" ]; then
    while IFS="" read -r p || [ -n "$p" ]; do
      printf '%40s\n' "${mopogreen}$p${normal}"
    done < "$script_dir"/assets/mopo.txt
  fi
}

retry () {
  sleep 5
  for i in {1..60}; do
    "$@" && break || warningmsg "Retry attempt $i failed, waiting..." && sleep 5;
  done
}

download_real_dump() {
  local database=$1
  local pannu_url=$2
  local dump_destination="$REAL_DUMP_DIR/$database.sqz"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" "$username@$pannu_url" "$dump_destination"
}

check_if_postgres_is_ready() {
  local container=$1
  local database=$2
  retry docker exec -u postgres "$container" pg_isready --dbname="$database"
}

reset_databases() {
  local args=("$@")
  local mode=${args[0]}
  local databases=${args[*]:1}

  local database_name_suffix=""
  local database_dump_dir=$ANON_DUMP_DIR
  if [[ $mode == "real" ]]; then
    database_name_suffix="-real"
    database_dump_dir=$REAL_DUMP_DIR
  fi

  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  docker-compose down
  docker-compose up -d ${databases[*]}

  for database in ${databases[@]}; do
    local database_dump="$database_dump_dir/$database.sqz"
    local database_container="$database"
    local database_name="$database$database_name_suffix"

    infomsg "Attempting to create database $database_name from dump $database_dump inside container $database_container"

    infomsg "Trying to remove possibly existing previous version of database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" dropdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Trying to create new database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" createdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Restoring database from dump database"
    msg "1. Copying dump..."
    docker cp "$database_dump" "$database_container:/asd.sqz"
    msg "2. Writing database..."
    docker exec "$database_container" pg_restore -U postgres --no-owner -F c --dbname="$database_name" -j4 /asd.sqz
    msg ""
  done

  successmsg "Database setup finished"
}

reset_all_anonymous_data() {
  infomsg "Downloading anonymous dumps"
  rm -rf "$ANON_DUMP_DIR" && git clone "$ANON_DUMPS_GIT_URL" "$ANON_DUMP_DIR"
  reset_databases "anon" ${DATABASES[*]} "$OODI_DB_NAME" #Remove oodi anon setup when oodi-db is deprecated
}

reset_all_real_data() {
  infomsg "Downloading real data dumps, asking for pannu password when needed"
  for i in ${!DATABASES[*]}; do
    download_real_dump "${DATABASES[$i]}" "${REAL_DUMP_URLS[$i]}"
  done
  reset_databases "real" ${DATABASES[*]}
}

reset_sis_importer_data() {
  infomsg "Downloading sis-importer-db dump"
  local database=$SIS_IMPORTER_DB_NAME
  download_real_dump $database $SIS_IMPORTER_DB_REAL_DUMP_URL
  reset_databases "real" $database
}

reset_old_oodi_data() {
  infomsg "Downloading old oodi-db dump"
  local database=$OODI_DB_NAME
  download_real_dump $database $OODI_DB_REAL_DUMP_URL
  reset_databases "real" $database
}

set_up_oodikone() {
  draw_mopo

  infomsg "Installing npm packages locally to enable linting"

  folders_to_set_up=(
    "$PROJECT_ROOT"
    "$PROJECT_ROOT/services/oodikone2-analytics"
    "$PROJECT_ROOT/services/oodikone2-frontend"
    "$PROJECT_ROOT/services/oodikone2-userservice"
    "$PROJECT_ROOT/services/backend/oodikone2-backend"
  )

  for folder in "${folders_to_set_up[@]}"; do
    cd "$folder" || return 1
    ([[ -d node_modules ]] && warningmsg "Packages already installed in $folder") || npm ci
  done
  cd "$PROJECT_ROOT" || return 1

  infomsg "Setting up databases with anonymous data"
  reset_all_anonymous_data

  infomsg "Building images."
  sh "$script_dir"/runner.sh oodikone anon build

  successmsg "Setup ready, oodikone can be started! See README for more info."
}

# === CLI ===

show_welcome() {
  local cashmoneyyellow=$(tput setaf 221)
  local normal=$(tput sgr0)
  if [ "$(tput cols)" -gt "76" ]; then
    while IFS="" read -r p || [ -n "$p" ]; do
      printf '%40s\n' "${cashmoneyyellow}$p${normal}"
    done < "$script_dir"/assets/logo.txt
  fi
  infomsg "Welcome to Oodikone CLI!"
  msg "This tool helps you in managing the project configuration. If you are new to
Oodikone development, you should probably run \"Set up oodikone\" which will
take care of setting up and starting Oodikone for you. See README for more
details."
  msg ""
}

init_dirs() {
  if [[ ! -d "$DUMP_DIR/real" ]]; then
    infomsg "Creating directory for dumps and giving read rights for docker script"
    mkdir -p "$DUMP_DIR/real"
    chmod -R g+r scripts/docker-entrypoint-initdb.d
  fi
}

# If username is not set, get username from data file.
# Ask user to provide username, if username was not found from data file.
get_username() {
  if [ ! -f "$USER_DATA_FILE" ]; then
    warningmsg "University username is needed to get database dumps from toska servers, please enter it now:"
    read -r username
    echo "$username" > "$USER_DATA_FILE"
    successmsg "Succesfully saved username for later usage."
  fi
  username=$(head -n 1 < "$USER_DATA_FILE")

  infomsg "Using your university username - $username - for getting database dumps"
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

# Run scripts before showing interactive prompt
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

