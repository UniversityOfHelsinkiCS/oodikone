
#!/bin/bash

# stop on first error
set -e

while getopts 's' flag; do
  case "${flag}" in
    s) SMOKE=1;
  esac
done

shift $(( OPTIND - 1 ))

if [ ! -z $SMOKE ]; then
  npm run test_services && npm run cypress:run:smoke
else
  npm run test_services && npm run cypress:run
fi
