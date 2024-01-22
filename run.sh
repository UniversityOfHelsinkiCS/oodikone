#!/usr/bin/env bash

# This script is used to run oodikone with different setups and is mainly used by
# scripts in package.json.
# Base for script: https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Fail immediately if script fails, unbound variables are referenced
# or command inside pipe fails. -E ensures cleanup trap fires in rare ERR cases.
set -euoE pipefail

# Set up constants
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Set up messages and exiting
source "$PROJECT_ROOT"/scripts/utils.sh

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") option [version] command --flag

Parameters:
* Option: oodikone/updater/both
* Version: anon/real. Not necessary when running down/logs/pull.
* Command: will be passed to docker-compose.
EOF
}

# Parse parameters. If arguments are not correct, print usage and exit with error.
parse_params() {
  args=("$@")

  [[ ${#args[@]} -eq 0 ]] && usage && die "Wrong number of arguments"
  option=${args[0]}

  #  parse arguments
  [[ ("$option" != "oodikone" && "$option" != "updater" && "$option" != "both") ]] && \
    usage && die "Wrong option: $option"

  [[ ${#args[@]} -eq 1 ]] && usage && die "Wrong number of arguments"

  # Some arguments can be passed without version. Otherwise parse version and then pass
  # rest to compose
  if [[ "${args[1]}" == "down" || "${args[1]}" == "logs" || "${args[1]}" == "pull" ]]; then
    version=""
    compose_command=${args[*]:1}
  else
    version=${args[1]}
    [[ "$version" != "anon" && "$version" != "real" ]] && usage && \
      die "Wrong version $version"
    compose_command=${args[*]:2}
  fi
  return 0
}

# Set which profile to use to launch correct services
parse_profiles() {
  if [[ "$option" == "both" ]]; then
    profiles="--profile oodikone --profile updater"
  else
    profiles="--profile $option"
  fi
  return 0
}

# Set which docker-compose files to use based on version.
parse_env() {
  env=""
  if [[ "$version" == "real" ]]; then
    env="--file docker-compose.yml --file docker-compose.real.yml"
  fi
  return 0
}

# === Run script ===

parse_params "$@"

# Create command that will be run. Empty command and "down" command will be handled
# differently.
parse_profiles
parse_env
if [[ "$compose_command" == "" ]]; then
  final_command="docker-compose ${env}"
else
  final_command="docker-compose ${env} ${profiles} ${compose_command}"
fi

msg "${BLUE}Running: ${final_command}${NOFORMAT}"
eval "$final_command"
