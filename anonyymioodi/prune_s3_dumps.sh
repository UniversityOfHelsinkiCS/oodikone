#!/usr/bin/env bash

# Delete old database dumps from s3. Dumps older than the retention period are
# removed, but the newest master dump of each database is always kept, so that a
# database which hasn't changed in a while can still be downloaded. Dumps from
# other branches aren't kept, so that old branches don't accumulate dumps.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

# The newest dump of each database from this branch is never pruned
MASTER_BRANCH="master"

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [-n|--dry-run] [-d|--days <days>] <database>... | all

Deletes the dumps in $S3_TARGET older than the given number of days
(default $S3_DUMP_RETENTION_DAYS). The newest $MASTER_BRANCH dump of each database is
always kept, or the newest dump of any branch if the database has no $MASTER_BRANCH dumps.

Databases: ${DATABASES[*]}

Options:
  -n, --dry-run      Print the dumps that would be deleted instead of deleting them
  -d, --days <days>  Delete dumps older than this many days
  -h, --help         Show this help
EOF
}

dry_run=false
days="$S3_DUMP_RETENTION_DAYS"
arguments=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n | --dry-run)
      dry_run=true
      shift
      ;;
    -d | --days)
      days="${2-}"
      [[ "$days" =~ ^[0-9]+$ ]] || {
        usage
        die "Expected a number of days for $1, got: $days"
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

if [[ ${#arguments[@]} -eq 0 ]]; then
  usage
  die "No database given"
fi

prune_database() {
  local database="$1"
  local deleted=0

  # s3cmd ls prints "<date> <time> <size> <object>", so sorting by the first two
  # columns in reverse puts the newest dump first
  local dumps
  dumps="$(s3 ls "$S3_TARGET/$database-" | sort -rk1,2)"

  # Find the newest master dump or in the case of it missing, the newest dump in general
  local kept
  kept="$(awk -v pattern="/$database-$MASTER_BRANCH-[0-9]+-[0-9]+[.]sql$" '$4 ~ pattern { print $4; exit }' <<< "$dumps")"
  [[ -n "$kept" ]] || kept="$(awk 'NR == 1 { print $4 }' <<< "$dumps")"

  # Remove any dumps older than the dump retention date (or -d)
  # except for master for which at least one dump is saved
  while read -r date time _ dump; do
    [[ -n "$dump" && "$dump" != "$kept" && "$date $time" < "$cutoff" ]] || continue
    if [[ "$dry_run" == true ]]; then
      infomsg "Dry run, would delete $dump"
    else
      s3 del "$dump"
    fi
    deleted=$((deleted + 1))
  done <<< "$dumps"

  if [[ "$dry_run" == true ]]; then
    successmsg "Would have pruned $deleted dump(s) of $database older than $days days"
  else
    successmsg "Pruned $deleted dump(s) of $database older than $days days"
  fi
}

resolve_databases "${arguments[@]}"
require_s3_config

cutoff="$(date -u -d "-$days days" '+%Y-%m-%d %H:%M')"

for database in "${selected_databases[@]}"; do
  prune_database "$database"
done
