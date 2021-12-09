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
  msg "${GREEN}$1${NOFORMAT}
  "
}
errormsg() {
  msg "${RED}$1${NOFORMAT}
  "
}
infomsg() {
  msg "${BLUE}$1${NOFORMAT}
  "
}
warningmsg() {
  msg "${ORANGE}$1${NOFORMAT}
  "
}

# Setup colors for messages if running interactive shell
if [[ -t 2 ]] && [[ "${TERM-}" != "dumb" ]]; then
  NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m'
else
  NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE=''
fi

# === Create images ===

retry () {
  sleep 5
  for i in {1..60}; do
    "$@" && break || warningmsg "Retry attempt $i failed, waiting..." && sleep 5;
  done
}

args=("$@")
if [[ ${#args[@]} -ne 1 ]]; then
  errormsg "No database given, exiting"
  exit 1
fi


infomsg "Restoring PostgreSQL dumps from backups. This might take a while."
database=${args[0]}
docker-compose down --remove-orphans
docker-compose up -d "$database"

database_dump="$database.sqz"
infomsg "Attempting to restore database $database from dump $database_dump"
retry docker-compose exec "$database" pg_isready --dbname="$database"
docker exec -i "$database" /bin/bash -c "pg_restore --username=postgres \
--format=custom --dbname=$database --no-owner" < "$database_dump"
successmsg "Database $database succesfully created"
