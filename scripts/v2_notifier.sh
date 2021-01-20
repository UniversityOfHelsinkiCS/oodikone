#!/bin/bash

OLD=$(git diff --name-only --cached | grep -Ec "(\/services\/|\/routes\/)")
NEW=$(git diff --name-only --cached | grep -Ec "(\/servicesV2\/|\/routesV2\/)")
if (( $OLD > $NEW )); then
    echo "Do not update old services or routes without updating SIS"
    exit 1
else 
    exit 0
fi