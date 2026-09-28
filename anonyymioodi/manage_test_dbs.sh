#!/usr/bin/env bash

# Front end for the test database scripts in this folder. Run it without
# arguments for an interactive menu, or give it an action and a database to run
# it directly, e.g. in CI.
#
# Each action is just a call to one of the scripts next to this one, so they can
# also be used on their own.

set -euo pipefail

# Here BASH_SOURCE[0] is used instead of $0 because it works
# consistently when ran normally and when sourced
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

ACTIONS=("download" "dump" "upload" "push" "release" "rebuild")

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [<action> <database>... | all]

Runs without arguments for an interactive menu.

Actions:
  download  Download the newest dumps from s3
  dump      Dump the databases from the running docker containers

  upload    Upload the current dumps to s3
  push      Build images from the current dumps and push them to the registry

  release   Dump from the running containers, then upload and push (shorthand)
  rebuild   Download the dumps from s3, then push (shorthand)

Databases: ${DATABASES[*]} all
EOF
}

# === Actions ===

download_dump() {
  "$SCRIPT_DIR"/download_dump_from_s3.sh "$1"
}

dump_database() {
  "$SCRIPT_DIR"/dump_local_db.sh "$1"
}

upload_dump() {
  "$SCRIPT_DIR"/upload_dump_to_s3.sh "$1"
}

push_image() {
  "$SCRIPT_DIR"/build_and_push_image.sh "$1"
}

run_action() {
  local action="$1"
  local database="$2"

  case "$action" in
    download) download_dump "$database" ;;
    dump) dump_database "$database" ;;
    upload) upload_dump "$database" ;;
    push) push_image "$database" ;;
    release)
      dump_database "$database"
      upload_dump "$database"
      push_image "$database"
      ;;
    rebuild)
      download_dump "$database"
      push_image "$database"
      ;;
    *)
      usage
      die "Unknown action: $action"
      ;;
  esac
}

run_action_for_all() {
  local action="$1"
  shift

  # Check if command was a proper command
  local known_action=false
  for known in "${ACTIONS[@]}"; do
    if [[ "$action" == "$known" ]]; then known_action=true; fi
  done
  if ! $known_action; then
    usage
    die "Unknown action: $action"
  fi

  resolve_databases "$@"
  for database in "${selected_databases[@]}"; do
    run_action "$action" "$database"
  done
  successmsg "Action $action done for: ${selected_databases[*]}"
}

# === Interactive menu ===

ask_and_run() {
  local action database

  PS3="Select action: "
  select action in "${ACTIONS[@]}" "quit"; do
    [[ -n "${action-}" ]] || continue
    if [[ "$action" == "quit" ]]; then exit 0; fi
    break
  done

  PS3="Select database: "
  select database in "${DATABASES[@]}" "all"; do
    [[ -n "${database-}" ]] || continue
    break
  done

  run_action_for_all "$action" "$database"
}

# === Run ===

if [[ "${1-}" == "-h" || "${1-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -eq 0 ]]; then
  while true; do
    ask_and_run
    echo
  done
fi

if [[ $# -lt 2 ]]; then
  usage
  die "Both an action and a database are required"
fi

run_action_for_all "$@"
