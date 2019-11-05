#!/bin/bash
#
# This script is used to execute npm commands inside multiple running docker services.
#
# Params:
#   -c (required). The npm command to execute in the services.
#     Example:
#       ./exec_command_for_services.sh -c lint
#
#   -e (optional). Sets the script to stop on first error.
#     Example:
#       ./exec_command_for_services.sh -e -c test
#
#   -p (optional). Additional params for the npm command.
#
# You can also run f.ex. "./exec_command_for_services.sh -c lint backend frontend"
# to run the specified command in some specific services (in this case, backend & frontend).

while getopts 'ec:p::' flag; do
  case "${flag}" in
    # Stop on first error
    e) set -e ;;
    c) COMMAND=${OPTARG};;
    p) PARAMS=${OPTARG};;
  esac
done

# Check that command is given
if [ -z $COMMAND ]; then
  echo "-c (command) missing"
  exit
fi

# Remove opts from argument list
shift $(( OPTIND - 1 ))

# Service names given as arguments
WHITELISTED_SERVICES=${@}

if [ ! -z "$WHITELISTED_SERVICES" ]; then
  services=$WHITELISTED_SERVICES
else
  services=(
    backend
    updater_writer
    updater_api
    updater_scheduler
    userservice
    frontend
    analytics
    userservice
    usageservice
  )
fi

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'

echo -e "Executing command ${RED}$COMMAND${NC} $([ -n "$PARAMS" ] && echo "with param(s) ${RED}${PARAMS[@]}${NC} ")to services ${Green}${services[@]}${NC}"

# Execute the given npm command in given services
for service in "${services[@]}";
  do docker-compose exec -T $service npm run "$COMMAND" --if-present -- "${PARAMS[@]}"
done
