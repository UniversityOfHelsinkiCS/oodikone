#!/bin/bash

# stop on first error
set -e

# define test commands
declare -a arr=(
"npm run test_services"
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

