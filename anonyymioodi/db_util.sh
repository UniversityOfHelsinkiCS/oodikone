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

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
LOCAL_DUMP_DIR="$PROJECT_ROOT/.databasedumps/local_containers"
S3_DUMP_DIR="$PROJECT_ROOT/.databasedumps/s3"
TEST_DUMP_DIR="$PROJECT_ROOT/.databasedumps/test" # Location where docker pulls .sql files

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
  local dump_location="$2"

  if [[ $(s3cmd ls s3:// | grep -q oodikone-test; echo $?) -eq 0 ]]
    then
      infomsg "OODIKONE-TEST bucket exists, skipping creation";
    else
      warningmsg "OODIKONE-TEST bucket doesn't exist, creating new bucket...";
      s3cmd -c "$S3_CONFIG_FILE" mb "s3://oodikone-test"
  fi

  infomsg "Pushing $dump_location/$database.sql to $S3_BUCKET"
  # TODO: Also compress files
  s3cmd -c "$S3_CONFIG_FILE" put "$dump_location/$database.sql" "$S3_BUCKET/$database.sql"
}


# === Build images ===
# Update registry with an existing dump located in .databasedumps/$2
build_and_push_image () {
  local database="$1"

  infomsg "Building docker image for $database\n"
  docker build "$PROJECT_ROOT" -t "$REGISTRY/$database" -f db.Dockerfile --build-arg DB_NAME="$database"
  successmsg "$database docker image built"
  infomsg "Pushing $database to $REGISTRY\n"
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
  cp --remove-destination -r "$LOCAL_DUMP_DIR" "$TEST_DUMP_DIR" # Move dump to the place where docker build pulls the .sql file from
}


# === Helpers ===
do_for_all () {
  local cmd="$1"
  shift # Removes $1 from "$@"

  infomsg "Running $1 for all databases"
  for database in "${DATABASES[@]}"; do
    "$cmd" "$database" "$@"
  done
  successmsg "$1 ran successfully"
}

init_menu () {
  PS3="Please enter your choice: "

  options=(
    "Pull dumps from s3"
    "Update dumps in s3 (s3 dumps)"
    "Dump from running docker images"
    "Update dumps in s3 (local docker dumps)"
    "Push new images to registry"
  )
}


# === RUN ===
init_menu

while true; do
  select opt in "${options[@]}"; do
    case "$opt" in
      "Pull dumps from s3")
        do_for_all download_s3_db "$S3_DUMP_DIR";;
      "Update dumps in s3 (s3 dumps)")
        do_for_all upload_s3_db;;
      "Dump from running docker images")
        do_for_all dump_local_db "$LOCAL_DUMP_DIR";;
      "Update dumps in s3 (local docker dumps)")
        do_for_all upload_s3_db "$LOCAL_DUMP_DIR";;
      "Push new images to registry")
        do_for_all build_and_push_image;;
    esac
  done
done
