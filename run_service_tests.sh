#!/bin/bash

# stop on first error
set -e
npm run --prefix services/oodikone2-backend test_docker
npm test --prefix services/oodikone2-analytics
npm run --prefix services/oodikone2-userservice test_docker
npm test --prefix services/oodikone2-usageservice
npm run --prefix services/oodikone2-frontend test_docker
# npm run --prefix services/updater_writer test_docker
