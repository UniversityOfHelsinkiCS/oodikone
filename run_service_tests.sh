#!/bin/bash

# stop on first error
set -e
docker-compose exec -T backend npm test
docker-compose exec -T updater_writer npm test
docker-compose exec -T updater_api npm test
# docker-compose exec -T updater_scheduler npm test
docker-compose exec -T userservice npm test
docker-compose exec -T frontend npm test
docker-compose exec -T analytics npm test
docker-compose exec -T usageservice npm test
