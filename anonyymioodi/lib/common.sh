#!/usr/bin/env bash

# Shared configuration and helpers for the anonyymioodi database scripts.
# Meant to be sourced by the other scripts in this folder, not run on its own.

# The configuration below is used by the sourcing scripts, not by this file
# shellcheck disable=SC2034

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
source "$PROJECT_ROOT"/scripts/utils.sh

# Dumps taken from running docker containers
LOCAL_DUMP_DIR="$PROJECT_ROOT/.databasedumps/local_containers"
# Dumps downloaded from s3
S3_DUMP_DIR="$PROJECT_ROOT/.databasedumps/s3"
# Where db.Dockerfile copies the .sql files from when an image is built
TEST_DUMP_DIR="$PROJECT_ROOT/.databasedumps/test"

# Used as a fallback when ACCESS_KEY and SECRET_KEY aren't set in the environment
S3_CONFIG_FILE=~/.s3cfg
S3_HOST="s3.datacloud.helsinki.fi"
S3_BUCKET="s3://oodikone"
# Dumps live under a prefix of their own inside the bucket
S3_TARGET="$S3_BUCKET/test-dbs"

REGISTRY="registry-toska.ext.ocp-prod-0.k8s.it.helsinki.fi"

# Databases, named after their docker compose services
DATABASES=("user-db" "kone-db" "sis-db" "sis-importer-db" "jami-db")

# Set by resolve_databases, read by the scripts sourcing this file
selected_databases=()

# The name of the postgres database inside the container. It matches the service
# name for every database except jami-db.
postgres_database_name() {
  local database="$1"
  if [[ "$database" == "jami-db" ]]; then
    echo "postgres"
  else
    echo "$database"
  fi
}

# Validates the given database names and expands "all" to every database.
# The result is set to the global array $selected_databases, because dying
# inside a subshell wouldn't stop the calling script.
resolve_databases() {
  selected_databases=()

  if [[ $# -eq 0 ]]; then
    die "No database given, expected one or more of: ${DATABASES[*]} all"
  fi

  for argument in "$@"; do
    if [[ "$argument" == "all" ]]; then
      selected_databases=("${DATABASES[@]}")
      return
    fi

    # Check if given databases are correct ones
    local known=false
    for database in "${DATABASES[@]}"; do
      if [[ "$argument" == "$database" ]]; then known=true; fi
    done
    $known || die "Unknown database: $argument. Expected one or more of: ${DATABASES[*]} all"

    selected_databases+=("$argument")
  done
}

# Dumps in s3 are named after the branch they were uploaded from, so the branch
# name has to be usable as a part of a file name. E.g. feature/foo -> feature-foo.
# feature/foo would result in a new bucket "feature" with a sub-bucket "foo"
sanitize_branch_name() {
  echo "${1//[^A-Za-z0-9._-]/-}"
}

current_branch_name() {
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" == "HEAD" ]]; then # Detached head, use the commit instead
    branch="$(git rev-parse --short HEAD)"
  fi
  sanitize_branch_name "$branch"
}

has_s3_env_credentials() {
  [[ -n "${ACCESS_KEY-}" && -n "${SECRET_KEY-}" ]]
}

# Credentials come from ACCESS_KEY and SECRET_KEY when both are set, and from
# $S3_CONFIG_FILE when neither is
require_s3_config() {
  command -v s3cmd > /dev/null || die "s3cmd not found, please install it first"

  if [[ -n "${ACCESS_KEY-}" || -n "${SECRET_KEY-}" ]]; then
    has_s3_env_credentials || die "Only one of ACCESS_KEY and SECRET_KEY is set, set both or neither"
    return
  fi

  [[ -f "$S3_CONFIG_FILE" ]] || die "Set ACCESS_KEY and SECRET_KEY, or add $S3_CONFIG_FILE. The \".s3cfg\" config file can be found on toska/dokumentaatio repo"
}

s3_env_config() {
  cat <<EOF
[default]
access_key = $ACCESS_KEY
secret_key = $SECRET_KEY
host_base = $S3_HOST
host_bucket = $S3_HOST
use_https = True
check_ssl_certificate = True
EOF
}

# Runs s3cmd with the credentials chosen by require_s3_config. The environment
# credentials are passed through process substitution, so that they aren't
# written to disk or visible in the process list.
s3() {
  if has_s3_env_credentials; then
    s3cmd -c <(s3_env_config) "$@"
  else
    s3cmd -c "$S3_CONFIG_FILE" "$@"
  fi
}

# The dump directories are created lazily by the scripts that write into them
make_dump_dirs() {
  mkdir -p "$LOCAL_DUMP_DIR" "$S3_DUMP_DIR" "$TEST_DUMP_DIR"
}
