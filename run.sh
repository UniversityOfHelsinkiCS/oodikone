#!/usr/bin/env bash

# This script is used to run oodikone with different setups and is mainly used by
# scripts in package.json. It passes all additional arguments to docker-compose as is.
# Script is based on https://betterdev.blog/minimal-safe-bash-script-template/

set -Eeuo pipefail # Fail fast if script fails

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") option version command --flag

Option: oodikone/updater
Version: anon/real/ci
Command: will be passed to docker-compose. Can't be empty

Following flags can be used:
-v or --verbose: for verbose mode (prints stack trace)
--no-color: colors not used
EOF
  exit
}

setup_colors() {
  if [[ -t 2 ]] && [[ -z "${NO_COLOR-}" ]] && [[ "${TERM-}" != "dumb" ]]; then
    NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m' PURPLE='\033[0;35m' CYAN='\033[0;36m' YELLOW='\033[1;33m'
  else
    NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE='' PURPLE='' CYAN='' YELLOW=''
  fi
}

msg() {
    echo >&2 -e "${1-}"
}

die() {
  local msg=$1
  local code=${2-1} # default exit status 1
  msg "${RED}${msg}${NOFORMAT}"
  exit "$code"
}

parse_params() {
  while :; do
    case "${1-}" in
    -v | --verbose) set -x ;;
    --no-color) NO_COLOR=1 ;;
    -?*) die "Unknown option: $1" ;;
    *) break ;;
    esac
    shift
  done
  setup_colors

  # Parse arguments. If arguments are not correct, print usage and exit with error.
  args=("$@")

  [[ ${#args[@]} -lt 3 ]] && usage && die
  option=${args[0]}
  version=${args[1]}
  [[ "$option" != "oodikone" && "$option" != "updater" ]] && usage && die
  [[ "$version" != "anon" && "$version" != "real" && "$version" != "ci" ]] && usage && die

  # Parse all additional arguments that will be passed to docker-compose.
  compose_command=${args[*]:2}
  return 0
}

# Set which services to launch based on option
parse_services() {
  [[ "$option" == "oodikone" ]] && services="db db_sis db_kone analytics analytics_db \
backend frontend user_db userservice adminer"
  [[ "$option" == "updater" ]] && services="db_sis sis-updater-nats \
sis-updater-scheduler sis-updater-worker redis adminer sis-importer-db"
  return 0
}

# Set docker-compose env overrides to use for each version (anon, real or ci)
parse_env() {
  [[ "$version" == "anon" ]] && env=""
  [[ "$version" == "real" ]] && env="-f docker-compose.yml -f docker-compose.real.yml"
  [[ "$version" == "ci" ]] && env="-f docker-compose.ci.yml"
  return 0
}

# Run helper functions
parse_params "$@"
parse_services
parse_env

## All things are not yet implemented, fail with error
[[ "$version" == "anon" ]] && die "${RED}Anon option not yet implemented${NOFORMAT}"
[[ "$version" == "ci" ]] && die "${RED}CI option not yet implemented${NOFORMAT}"

# Create command that will be run. Empty command (e.g. just ./run oodikone real) and
# "down" command will be handled differently, otherwise just pass all commands
echo "comp command $compose_command"
if [[ "$compose_command" == "" ]]; then
  final_command="docker-compose ${env}"
elif [[ "$compose_command" == *"down"* ]]; then
  final_command="docker-compose ${compose_command}"
else
  final_command="docker-compose ${env} ${compose_command} ${services}"
fi

msg "${BLUE}Running: ${final_command}${NOFORMAT}"
eval "$final_command"
