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

b=4

echo "Executing command $1 $([ -n "$2" ] && echo "with param(s) ${@:2} ")to services ${services[@]}"

for service in "${services[@]}";
  do docker-compose exec -T $service npm run "$1" --if-present -- "${@:2}"
done
