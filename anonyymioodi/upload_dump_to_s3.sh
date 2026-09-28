#!/usr/bin/env bash

# Upload database dumps from .databasedumps/test to s3, naming the objects
# <database>-<git_branch>-<datetime>.sql so that dumps don't overwrite each other.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [-n|--dry-run] <database>... | all

Uploads the dumps in .databasedumps/test to $S3_TARGET
as <database>-<git_branch>-<datetime>.sql. Run dump_local_db.sh first to
create the dumps.

Databases: ${DATABASES[*]}

Options:
  -n, --dry-run  Print the s3cmd command instead of running it
  -h, --help     Show this help
EOF
}

dry_run=false
arguments=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n | --dry-run)
      dry_run=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      usage
      die "Unknown option: $1"
      ;;
    *)
      arguments+=("$1")
      shift
      ;;
  esac
done

if [[ ${#arguments[@]} -eq 0 ]]; then
  usage
  die "No database given"
fi

upload_database() {
  local database="$1"
  local dump_file="$TEST_DUMP_DIR/$database.sql"

  [[ -f "$dump_file" ]] || die "No dump found at $dump_file, run dump_local_db.sh first"
  [[ -s "$dump_file" ]] || die "Dump is empty: $dump_file"

  local datetime
  datetime="$(date +%Y%m%d-%H%M%S)"
  local target="$S3_TARGET/$database-$branch-$datetime.sql"

  if [[ "$dry_run" == true ]]; then
    infomsg "Dry run, would run: s3cmd put $dump_file $target"
    return
  fi

  infomsg "Pushing $dump_file to $target"
  s3 put "$dump_file" "$target"
  successmsg "Uploaded $dump_file to $target"
}

resolve_databases "${arguments[@]}"
require_s3_config

if [[ "$dry_run" == false ]]; then
  "$SCRIPT_DIR"/create_s3_bucket.sh
fi

branch="$(current_branch_name)"

for database in "${selected_databases[@]}"; do
  upload_database "$database"
done
