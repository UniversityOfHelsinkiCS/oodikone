#!/bin/bash

# This script is used to run an npm command in all directories
# in services/ which contain a package.json (excluding node_modules)

# Params:
#   -c (required). The npm command to execute in the services.
#       Example:
#           ./exec_services_npm.sh -c lint
#
#   -e (optional). Sets the script to stop on first error.
#     Example:
#       ./exec_command_for_services.sh -e -c test
#
#   -p (optional). Additional params for the npm command.
#
#   -t (optional). Amount of threads to use to run the commands in parallel.
#                  Defaults to "getconf _NPROCESSORS_ONLN".

if [[ ! -d 'services' ]]; then
    echo 'Directory "services" not found in current directory'
    echo 'Please make sure PWD is the root of the repository!'
    exit 1
fi

while getopts 'ec:p::' flag; do
  case "${flag}" in
    # Stop on first error
    e) set -e ;;
    c) COMMAND=${OPTARG};;
    p) PARAMS=${OPTARG};;
    t) THREADS="${OPTARG}"
  esac
done

# Check that command is given
if [ -z $COMMAND ]; then
  echo "-c (command) missing"
  exit
fi

if [[ -z $THREADS ]]; then
  THREADS="$(getconf _NPROCESSORS_ONLN)"
fi

if [[ ! -z $CI ]]; then
  THREADS='2'
fi

# Remove opts from argument list
shift $(( OPTIND - 1 ))

directories="$(find ./services -path '**/node_modules' -prune -o -name 'package.json' -exec dirname {} \;)"

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'

echo -e "Executing command ${RED}$COMMAND${NC} $([ -n "$PARAMS" ] && echo "with param(s) ${RED}${PARAMS[@]}${NC} ")in directories:\n${Green}${directories[@]}${NC}"
echo ''

if [[ -n "$PARAMS" ]]
then
    echo "$directories" | xargs -n 1 -P "$THREADS" -i{} bash -c "pushd '{}' > /dev/null ; npm run --if-present '$COMMAND' -- '${PARAMS[@]}' | sed -e \"s/^/\$(basename \$PWD): /;\" ; popd > /dev/null"
else
    echo "$directories" | xargs -n 1 -P "$THREADS" -i{} bash -c "pushd '{}' > /dev/null ; npm run --if-present '$COMMAND' | sed -e \"s/^/\$(basename \$PWD): /;\" ; popd > /dev/null"
fi
