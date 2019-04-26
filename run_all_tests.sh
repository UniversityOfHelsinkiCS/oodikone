#!/bin/bash

# stop on first error
set -e

# define test commands
declare -a arr=(
"npm run --prefix services/oodikone2-backend test_docker"
"npm test --prefix services/oodikone2-analytics"
"npm run --prefix services/oodikone2-userservice test_docker"
"npm test --prefix services/oodikone2-usageservice"
"npm test --prefix services/oodikone2-frontend"
"npm run cypress:run"
)

# run tests in parallel and store pids in array
for i in "${!arr[@]}"; do
    echo "RUNNING ${arr[$i]}"
    eval "${arr[$i]}" &
    pids[${i}]=$!
done

# wait for all pids
for pid in ${pids[*]}; do
    wait $pid
done

