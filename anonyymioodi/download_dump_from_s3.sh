#!/usr/bin/env bash

# Download database dumps from s3 into .databasedumps/s3, and copy them to
# .databasedumps/test where db.Dockerfile reads them from.
#
# Dumps are uploaded as <db_name>-<git_branch>-<datetime>.sql (see
# upload_dump_to_s3.sh), so the newest matching dump is the one downloaded.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [-b|--branch <branch>] <database>... | all

Downloads the newest dump of each given database from $S3_TARGET.
Databases: ${DATABASES[*]}

Options:
  -b, --branch <branch>  Only consider dumps uploaded from this git branch
  -h, --help             Show this help
EOF
}

branch=""
arguments=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b | --branch)
      branch="${2-}"
      [[ -n "$branch" ]] || {
        usage
        die "Missing value for $1"
      }
      shift 2
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

# Newest object in s3 for the given database, or empty if there are none
newest_dump_in_s3() {
  local database="$1"
  local prefix="$S3_TARGET/$database-"
  if [[ -n "$branch" ]]; then prefix="$prefix$(sanitize_branch_name "$branch")-"; fi

  # s3cmd ls prints "<date> <time> <size> <object>", so sorting by the first two
  # columns in reverse puts the newest dump first
  s3 ls "$prefix" | sort -rk1,2 | awk 'NR == 1 { print $4 }'
}

download_database() {
  local database="$1"
  local dump_file="$S3_DUMP_DIR/$database.sql"
  local newest_dump
  newest_dump="$(newest_dump_in_s3 "$database")"

  [[ -n "$newest_dump" ]] || die "No dumps found for $database in $S3_TARGET${branch:+ (branch $branch)}"

  infomsg "Downloading $newest_dump"
  s3 get --force "$newest_dump" "$dump_file"
  cp --remove-destination "$dump_file" "$TEST_DUMP_DIR/$database.sql"
  successmsg "Downloaded $newest_dump to $dump_file"
}

if [[ ${#arguments[@]} -eq 0 ]]; then
  usage
  die "No database given"
fi

resolve_databases "${arguments[@]}"
require_s3_config
make_dump_dirs

for database in "${selected_databases[@]}"; do
  download_database "$database"
done
