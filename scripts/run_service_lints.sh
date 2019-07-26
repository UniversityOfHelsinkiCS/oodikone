#!/bin/bash

# stop on first error
set -e
docker-compose exec -T backend npm run lint
docker-compose exec -T updater_writer npm  run lint
docker-compose exec -T updater_api npm run lint
docker-compose exec -T updater_scheduler npm run lint
docker-compose exec -T userservice npm run lint
docker-compose exec -T frontend npm run lint
docker-compose exec -T analytics npm run lint
docker-compose exec -T userservice npm run lint
