#!/bin/bash

# stop on first error
set -e

npm run concurrently "npm run test_services" "npm run cypress:run"

