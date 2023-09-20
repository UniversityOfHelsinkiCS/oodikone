#!/usr/bin/env bash

# This file includes functions that are used to setup oodikone. File doesn't run anything
# by itself and should be sourced from other script.

# === Config ===

# Set up constants
## Folders
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
DUMP_DIR="$PROJECT_ROOT/.databasedumps"
USER_DATA_FILE="$DUMP_DIR/hyuserdata"
DOCKER_COMPOSE=$PROJECT_ROOT/docker-compose.yml

## Following the naming convention in docker-compose, these are names for database
## services. The real data databases inside service will have names suffixed by "-real".
KONE_DB_NAME="kone-db"
SIS_DB_NAME="sis-db"
SIS_IMPORTER_DB_NAME="sis-importer-db"
USER_DB_NAME="user-db"
DATABASES=("$KONE_DB_NAME" "$SIS_DB_NAME" "$SIS_IMPORTER_DB_NAME" "$USER_DB_NAME")

## Urls should be in same order as databases as both are iterated through by indexes.
KONE_DB_REAL_DUMP_URL="svm-116.cs.helsinki.fi:/home/toska_user/most_recent_backup_store/oodikone-kone-db.sql.gz"
SIS_DB_REAL_DUMP_URL="svm-116.cs.helsinki.fi:/home/toska_user/most_recent_backup_store/oodikone-sis-db.sql.gz"
SIS_IMPORTER_DB_REAL_DUMP_URL="svm-116.cs.helsinki.fi:/home/toska_user/most_recent_backup_store/importer.sql.gz"
USER_DB_REAL_DUMP_URL="svm-116.cs.helsinki.fi:/home/toska_user/most_recent_backup_store/oodikone-user-db.sql.gz"
REAL_DUMP_URLS=("$KONE_DB_REAL_DUMP_URL" "$SIS_DB_REAL_DUMP_URL" "$SIS_IMPORTER_DB_REAL_DUMP_URL" "$USER_DB_REAL_DUMP_URL")

# Source utility functions
source "$PROJECT_ROOT"/scripts/utils.sh

# === Function ===

draw_mopo() {
  # Some hacks to print mopo as green, since colours from common config don't work when
  # catting images. Please feel free to fix this. And tell otahontas how you did it!
  local mopogreen
  mopogreen=$(tput setaf 34)
  local normal
  normal=$(tput sgr0)
  if [ "$(tput cols)" -gt "100" ]; then
    while IFS="" read -r p || [ -n "$p" ]; do
      printf '%40s\n' "${mopogreen}$p${normal}"
    done < "$PROJECT_ROOT"/scripts/assets/mopo.txt
  fi
}

retry() {
  sleep 5
  for i in {1..60}; do
    "$@" && break || warningmsg "Retry attempt $i failed, waiting..." && sleep 5;
  done
}

download_real_dump() {
  local database=$1
  local pannu_url=$2
  local dump_destination="$DUMP_DIR/$database.sql.gz"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" "$username@$pannu_url" "$dump_destination"
}

check_if_postgres_is_ready() {
  local container=$1
  local database=$2
  retry docker exec -u postgres "$container" pg_isready --dbname="$database"
}

reset_databases() {
  local databases=("$@")
  local database_dump_dir=$DUMP_DIR

  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  npm run docker:down
  docker-compose up -d "${databases[@]}"

  for database in "${databases[@]}"; do
    local database_dump="$database_dump_dir/$database.sql.gz"
    local database_container="$database"
    local database_name="$database-real"

    infomsg "Attempting to create database $database_name from dump $database_dump inside container $database_container"

    infomsg "Trying to remove possibly existing previous version of database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" dropdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Trying to create new database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" createdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Restoring database from dump database"
    msg "Writing database..."
    docker exec -i "$database_container" /bin/bash  -c "gunzip | psql -U postgres -d $database_name" < "$database_dump" 2> /dev/null
    msg ""
  done

  successmsg "Database setup finished"
}

reset_jami_data() {
  local database="jami-db"
  local pannu_url="svm-116.cs.helsinki.fi:/home/toska_user/most_recent_backup_store/jami.sql.gz"
  local dump_destination="$DUMP_DIR/$database.sql.gz"

  infomsg "Downloading Jami data"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" "$username@$pannu_url" "$dump_destination"

  infomsg "Removing database and related volume"
  docker volume rm oodikone_jami-data || warningmsg "This is okay, continuing"
  docker-compose -f "$DOCKER_COMPOSE" down "$database" || warningmsg "This is okay, continuing"

  infomsg "Starting postgres in the background"
  docker-compose -f "$DOCKER_COMPOSE" up -d "$database"
  retry docker-compose -f "$DOCKER_COMPOSE" exec "$database" pg_isready --dbname="postgres"

  infomsg "Populating Jami"
  docker exec -i "$database" /bin/bash -c "gunzip | psql -U postgres" < "$dump_destination" 2> /dev/null
  docker-compose stop "$database"
  msg ""
}

reset_all_real_data() {
  infomsg "Downloading real data dumps, asking for pannu password when needed"
  for i in ${!DATABASES[*]}; do
    local database="${DATABASES[$i]}"
    local url="${REAL_DUMP_URLS[$i]}"
    download_real_dump "$database" "$url"
  done
  reset_jami_data
  reset_databases "${DATABASES[@]}"
}

restore_data_from_dumps() {
  infomsg "Restoring earlier-downloaded dumps to databases"
  reset_databases "${DATABASES[@]}"
}

reset_single_database() {
  # Define custom shell prompt for the nested interactive select loop
  PS3="Please enter which database to reset: "

  options=(
    "kone-db"
    "sis-db"
    "sis-importer-db"
    "user-db"
    "jami-db"
    "Return to main menu."
  )

  local database=""
  local url=""

  while true; do
    select opt in "${options[@]}"; do
      case $opt in
        "kone-db")
          local database=$KONE_DB_NAME
          local url=$KONE_DB_REAL_DUMP_URL
          break 2;;
        "sis-db")
          local database=$SIS_DB_NAME
          local url=$SIS_DB_REAL_DUMP_URL
          break 2;;
        "sis-importer-db")
          local database=$SIS_IMPORTER_DB_NAME
          local url=$SIS_IMPORTER_DB_REAL_DUMP_URL
          break 2;;
        "user-db")
          local database=$USER_DB_NAME
          local url=$USER_DB_REAL_DUMP_URL
          break 2;;
        "jami-db")
          reset_jami_data
          break 2;;
        "Return to main menu.")
          break 2;;
        *) msg "${RED}Invalid option:${NOFORMAT} $REPLY
  ";;
      esac
      break
    done
  done

  if [ -n "$database" ]; then
    infomsg "Downloading $database dump"
    download_real_dump $database $url
    reset_databases $database
  fi
}

set_up_oodikone_from_scratch() {
  draw_mopo
  folders_to_set_up=(
    "$PROJECT_ROOT"
    "$PROJECT_ROOT/services/frontend"
    "$PROJECT_ROOT/services/backend"
    "$PROJECT_ROOT/updater/sis-updater-scheduler"
    "$PROJECT_ROOT/updater/sis-updater-worker"
  )

  infomsg "Cleaning up docker setup and node_modules from possible previous installations"
  local compose_down_args="--remove-orphans --volumes --rmi all"
  "$PROJECT_ROOT"/run.sh both down "$compose_down_args" || infomsg "Cleaning errored, but will continue"
  docker-compose --file "$PROJECT_ROOT"/docker-compose.test.yml "$compose_down_args" || infomsg "Cleaning errored, but will continue"
  docker-compose --file "$PROJECT_ROOT"/docker-compose.ci.yml "$compose_down_args" || infomsg "Cleaning errored, but will continue"
  for folder in "${folders_to_set_up[@]}"; do
    cd "$folder" || die "Couldn't change directory to folder $folder"
    rm -rf node_modules|| die "Couldn't remove node_modules in folder $folder"
  done

  infomsg "Installing npm packages locally to root and each subfolder to enable \
linting and formatting"

  for folder in "${folders_to_set_up[@]}"; do
    cd "$folder" || die "Couldn't change directory to folder $folder"
    ([[ -d node_modules ]] && die "$folder already has node_modules, exiting!") || npm ci
  done
  cd "$PROJECT_ROOT" || die "Couldn't change directory to project root"

  infomsg "Setting up husky for pre-commit linting"
  npm run prepare

  infomsg "Pulling images"
  "$PROJECT_ROOT"/run.sh both anon pull

  infomsg "Building images"
  "$PROJECT_ROOT"/run.sh both anon build

  successmsg "Setup ready, oodikone can be started! See README for more info."
}

docker_prune() {
  infomsg "Running: docker system prune -a && docker volume prune -a"
  docker system prune -a && docker volume prune -a
}

init_dirs() {
  if [[ ! -d "$DUMP_DIR" ]]; then
    infomsg "Creating directory for dumps"
    mkdir "$DUMP_DIR"
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
