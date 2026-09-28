#!/usr/bin/env bash

# Dump one or more databases from the running docker containers into
# .databasedumps/local_containers, and copy them to .databasedumps/test where
# db.Dockerfile reads them from.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") <database>... | all

Dumps the given databases from their running containers.
Databases: ${DATABASES[*]}
EOF
}

if [[ "${1-}" == "-h" || "${1-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -eq 0 ]]; then
  usage
  die "No database given"
fi

dump_database() {
  local database="$1"
  local container_name="oodikone-$database"
  local database_name
  database_name="$(postgres_database_name "$database")"
  local dump_file="$LOCAL_DUMP_DIR/$database.sql"

  infomsg "Dumping $database from container $container_name"
  # Dump to a temporary file first, so that a failed dump doesn't overwrite the previous one
  docker exec -i "$container_name" pg_dump -Fp -U postgres -d "$database_name" > "$dump_file.tmp"
  mv "$dump_file.tmp" "$dump_file"
  cp --remove-destination "$dump_file" "$TEST_DUMP_DIR/$database.sql"
  successmsg "Dumped $database to $dump_file"
}

resolve_databases "$@"
make_dump_dirs

for database in "${selected_databases[@]}"; do
  dump_database "$database"
done
