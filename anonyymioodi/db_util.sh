#!/usr/bin/env bash

# === Config ===

# Quit if failing
set -euo pipefail

# Print messages and logs that are not script output to stderr
msg() {
    echo >&2 -e "${1-}"
}

# Some special types of messages with colours
successmsg() {
  msg "${GREEN}$1${NOFORMAT}"
}
errormsg() {
  msg "${RED}$1${NOFORMAT}"
}
infomsg() {
  msg "${BLUE}$1${NOFORMAT}"
}
warningmsg() {
  msg "${ORANGE}$1${NOFORMAT}"
}

# Setup colors for messages if running interactive shell
if [[ -t 2 ]] && [[ "${TERM-}" != "dumb" ]]; then
  NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m'
else
  NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE=''
fi


# === #

PROJECT_ROOT="$(git rev-parse --show-toplevel)"

get_project_relative_path () {
  local absolute_path="$1"
  local root="$2"
  realpath -s --relative-to="${root:-$PROJECT_ROOT}" "$absolute_path"
}

LOCAL_DUMP_DIR="$(get_project_relative_path ".databasedumps/local_containers" "$PWD")" # Dumps from running docker containers
S3_DUMP_DIR="$(get_project_relative_path ".databasedumps/s3" "$PWD")" # Dumps from s3
TEST_DUMP_DIR="$(get_project_relative_path ".databasedumps/test" "$PWD")" # Location where .sql files are pulled while building the new image

S3_CONFIG_FILE=~/.s3cfg
S3_BUCKET="s3://oodikone-test"

REGISTRY="registry-toska.ext.ocp-prod-0.k8s.it.helsinki.fi"

## Following the naming convention in docker compose, these are names for database
## services. The real data databases inside service will have names suffixed by "-real".
KONE_DB_NAME="kone-db"
SIS_DB_NAME="sis-db"
SIS_IMPORTER_DB_NAME="sis-importer-db"
USER_DB_NAME="user-db"
JAMI_DB_NAME="jami-db"
DATABASES=("$USER_DB_NAME" "$KONE_DB_NAME" "$SIS_DB_NAME" "$SIS_IMPORTER_DB_NAME" "$JAMI_DB_NAME")

mkdir -p "$TEST_DUMP_DIR"
mkdir -p "$S3_DUMP_DIR"
mkdir -p "$LOCAL_DUMP_DIR"


# === Handle s3 bucket ===
# Use s3 bucket as the dump save/pull location
download_s3_db () {
  local database="$1"

  # TODO: Decompress compressed files
  s3cmd -c "$S3_CONFIG_FILE" get "$S3_BUCKET/$database.sql" "$S3_DUMP_DIR/$database.sql"
  cp --remove-destination -r "$S3_DUMP_DIR" "$TEST_DUMP_DIR" # Move dumps to the place where docker build pulls .sql files from
}

upload_s3_db () {
  local database="$1"

  if [[ $(s3cmd ls s3:// | grep -q oodikone-test; echo $?) -eq 0 ]]
    then
      infomsg "OODIKONE-TEST bucket exists, skipping creation";
    else
      warningmsg "OODIKONE-TEST bucket doesn't exist, creating new bucket...";
      s3cmd -c "$S3_CONFIG_FILE" mb "s3://oodikone-test"
  fi

  infomsg "Pushing $TEST_DUMP_DIR/$database.sql to $S3_BUCKET"
  # TODO: Also compress files
  s3cmd -c "$S3_CONFIG_FILE" put "$TEST_DUMP_DIR/$database.sql" "$S3_BUCKET/$database.sql"
}


# === Build images ===
# Update registry with an existing dump located in .databasedumps/test/$1.sql
build_and_push_image () {
  local database="$1"

  infomsg "Building docker image for $database\n"
  docker build "$(get_project_relative_path "$PROJECT_ROOT" "$PWD")" -t "$REGISTRY/$database:latest" -f db.Dockerfile --build-arg DB_NAME="$database"
  successmsg "$database docker image built"
  infomsg "Pushing $database to $REGISTRY\n"
  infomsg "$REGISTRY/$database"
  docker push "$REGISTRY/$database"
  successmsg "Image $REGISTRY/$database pushed successfully"
}


# === Handle dumping local dbs ===
# To conveniently update all dbs, build all with docker-compose.db.yml and then run dump_all_local_dbs
dump_local_db () {
  local database="$1"
  local container_name="oodikone-$1"
  local database_name="$database"

  if [[ $database == "jami-db" ]]; then database_name="postgres"; fi

  infomsg "Trying to dump $database to $LOCAL_DUMP_DIR/$database.sql"
  docker exec -i "$container_name" pg_dump -Fp -U postgres -d "$database_name" > "$LOCAL_DUMP_DIR/$database.sql"
  successmsg "Dumped $database to $LOCAL_DUMP_DIR/$database.sql"
  cp --remove-destination -r "$LOCAL_DUMP_DIR/$database.sql" "$TEST_DUMP_DIR" # Move dump to the place where docker build pulls the .sql file from
}


# === Helpers ===
do_for_all () {
  local cmd="$1"
  shift # Removes $1 from "$@"

  infomsg "Running $cmd for all databases"
  for database in "${DATABASES[@]}"; do
    "$cmd" "$database" "$@"
  done
  successmsg "$cmd ran successfully"
}

ask_for_input () {
  local cmd="$1"
  shift # Removes $1 from "$@"

  echo

  init_database_menu
  select database in "${options[@]}"; do
    "$cmd" "$database" "$@"
    break
  done
}


init_action_menu () {
  PS3="Please enter your choice: "

  options=(
    "Pull dumps from s3"
    "Dump from running docker images"
    "Update dumps in s3"
    "Push new images to registry"
  )
}

init_mode_menu () {
  PS3="Select command mode: "
  options=(
    "Run command for all databases"
    "Select single database"
  )
}

init_database_menu () {
  PS3="Select database: "
  options=("${DATABASES[@]}")
}


# === RUN ===
while true; do
  init_mode_menu
  select mode in "${options[@]}"; do
    case "$mode" in
      "Run command for all databases")
        cmd="do_for_all"
        break;;
      "Select single database")
        cmd="ask_for_input"
        break;;
    esac
  done

  echo

  echo

  init_action_menu
  select opt in "${options[@]}"; do
    case "$opt" in
      "Pull dumps from s3")
        "$cmd" download_s3_db "$S3_DUMP_DIR"
        break;;
      "Dump from running docker images")
        "$cmd" dump_local_db "$LOCAL_DUMP_DIR"
        break;;
      "Update dumps in s3")
        "$cmd" upload_s3_db
        break;;
      "Push new images to registry")
        "$cmd" build_and_push_image
        break;;
    esac
  done

  echo
done
