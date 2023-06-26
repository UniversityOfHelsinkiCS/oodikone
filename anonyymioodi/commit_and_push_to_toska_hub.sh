#!/usr/bin/env bash

# === Config ===

# Quit if failing
set -euo pipefail

# Print messages and logs that are not script output to stderr
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

# Setup colors for messages if running interactive shell
if [[ -t 2 ]] && [[ "${TERM-}" != "dumb" ]]; then
  NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m'
else
  NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE=''
fi

args=("$@")
if [[ ${#args[@]} -ne 1 ]]; then
  errormsg "No database given, exiting"
  exit 1
fi

infomsg "Committing and pushing to registry"
database=${args[0]}
docker commit "$database" "registry-toska.ext.ocp-prod-0.k8s.it.helsinki.fi/$database"
docker push "registry-toska.ext.ocp-prod-0.k8s.it.helsinki.fi/$database"
successmsg "Succesfully pushed"
