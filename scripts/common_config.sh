#!/usr/bin/env bash

# This script is includes common configs used in oodikone scripts.
# Configs are based on https://betterdev.blog/minimal-safe-bash-script-template/

# Fail immediately if script fails, unbound variables are referenced
# or command inside pipe fails. -E ensures cleanup trap fires in rare ERR cases.
set -euoE pipefail

# Try to run cleanup function after things fail.
trap cleanup SIGINT SIGTERM ERR EXIT

# By default cleanup doesn't do anything. To overwrite, copy this function to script
# common was sourced from.
cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  # script cleanup here
}


# Print messages and logs that are not script output
msg() {
    echo >&2 -e "${1-}"
}

# Some special types of messages with colours
successmsg() {
  msg "${GREEN}$1${NOFORMAT}
  "
}
errormsg() {
  msg "${RED}$1${NOFORMAT}
  "
}
infomsg() {
  msg "${BLUE}$1${NOFORMAT}
  "
}
warningmsg() {
  msg "${ORANGE}$1${NOFORMAT}
  "
}

# Quit and exit with given message and error code
# By default uses exit code 1, message must be given.
die() {
  local msg=$1
  local code=${2-1}
  msg "${RED}${msg}${NOFORMAT}"
  exit "$code"
}

# Setup colors for logging if possible
if [[ -t 2 ]] && [[ "${TERM-}" != "dumb" ]]; then
  NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m' PURPLE='\033[0;35m' CYAN='\033[0;36m' YELLOW='\033[1;33m'
else
  NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE='' PURPLE='' CYAN='' YELLOW=''
fi
