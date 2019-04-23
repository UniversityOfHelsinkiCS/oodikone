#!/bin/bash

set -e
npm run  --prefix services/oodikone2-backend test_docker
npm test  --prefix services/oodikone2-analytics
npm run  --prefix services/oodikone2-userservice test_docker
npm test  --prefix services/oodikone2-usageservice
npm test  --prefix services/oodikone2-frontend
npm run cypress:run
