#!/bin/bash

# stop on first error
set -e
docker-compose exec backend npm test
docker-compose exec userservice npm test
docker-compose exec frontend npm test
docker-compose exec analytics npm test
docker-compose exec usageservice npm test
# docker-compose exec updater_writer npm test
