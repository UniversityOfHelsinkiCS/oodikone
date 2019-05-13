#!/bin/bash

# stop on first error
set -e

# Async version -- the hare. 
# npm run concurrently "npm run test_services" "npm run cypress:run"

# Sync version -- the tortoise.
npm run test_services && npm run cypress:run

