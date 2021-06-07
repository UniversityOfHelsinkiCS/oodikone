#!/usr/bin/env bash

# This script is used to run oodikone with different setups and is mainly used by 
# scripts in package.json. It passes all additional arguments to docker-compose as is.
# Script is based on https://betterdev.blog/minimal-safe-bash-script-template/

set -Eeuo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") option version command --flag

Option: oodikone/updater
Version: anon/real/ci
Command: will be passed to docker-compose

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
  msg "$msg"
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

  args=("$@")

  # check required arguments
  [[ ${#args[@]} -lt 2 ]] && usage && die 
  [[ $1 != "oodikone" && $1 != "updater" ]] && usage && die
  [[ $2 != "anon" && $2 != "real" && $2 != "ci" ]] && usage && die
  return 0
}

parse_params "$@"
setup_colors

# SCRIPT LOGIC
