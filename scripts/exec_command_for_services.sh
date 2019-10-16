#!/bin/bash

# stop on first error
set -e

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


RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'

echo -e "Executing command ${RED}$1${NC} $([ -n "$2" ] && echo "with param(s) ${RED}${@:2}${NC} ")to services ${Green}${services[@]}${NC}"

for service in "${services[@]}";
  do docker-compose exec -T $service npm run "$1" --if-present -- "${@:2}"
done
