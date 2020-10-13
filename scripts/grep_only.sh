#!/bin/bash

RESULT=$(git grep -HEn --cached "(it|describe)\.only" $(git diff --cached --name-only) ./cypress)
if [ ! -z "$RESULT" ]; then
    echo -e "\e[31mDo not commit .only-tests. Did you remember to git add?\e[0m"
    echo -e "$RESULT"
    exit 1
else
    echo "No .only-tests found"
    exit 0
fi