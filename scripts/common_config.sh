#!/usr/bin/env bash

# This script is includes common configs used in oodikone scripts.
# Configs are based on https://betterdev.blog/minimal-safe-bash-script-template/

# Fail immediately if script fails, unbound variables are referenced
# or command inside pipe fails
set -euoE pipefail

# Allow scripts to use colours in msg
setup_colors() {
  if [[ -t 2 ]] && [[ -z "${NO_COLOR-}" ]] && [[ "${TERM-}" != "dumb" ]]; then
    NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m' PURPLE='\033[0;35m' CYAN='\033[0;36m' YELLOW='\033[1;33m'
  else
    NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE='' PURPLE='' CYAN='' YELLOW=''
  fi
}

# Log messages to stdout
msg() {
    echo >&2 -e "${1-}"
}

# Quit and exit with given message and error code
# By default uses exit code 1 and red colour
die() {
  local msg=$1
  local code=${2-1}
  msg "${RED}${msg}${NOFORMAT}"
  exit "$code"
}
