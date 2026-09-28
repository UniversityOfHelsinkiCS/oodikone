#!/usr/bin/env bash

# Build database images from the dumps in .databasedumps/test and push them to
# the Toska registry.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") <database>... | all

Builds an image of each given database and pushes it to $REGISTRY.
The dump is read from .databasedumps/test/<database>.sql, so run
dump_local_db.sh or download_dump_from_s3.sh first.

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

build_and_push_image() {
  local database="$1"
  local image="$REGISTRY/$database:latest"
  local dump_file="$TEST_DUMP_DIR/$database.sql"

  [[ -f "$dump_file" ]] || die "No dump found at $dump_file, run dump_local_db.sh or download_dump_from_s3.sh first"

  infomsg "Building $image"
  docker build "$PROJECT_ROOT" -f "$PROJECT_ROOT/db.Dockerfile" -t "$image" --build-arg DB_NAME="$database"

  infomsg "Pushing $image"
  docker push "$image"
  successmsg "Pushed $image"
}

resolve_databases "$@"

for database in "${selected_databases[@]}"; do
  build_and_push_image "$database"
done
