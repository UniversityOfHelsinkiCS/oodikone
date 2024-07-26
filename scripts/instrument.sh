#!/usr/bin/env bash

# This script is used for instrumenting the frontend code
# Counters are added for calculating the code coverage
# Instrumented code is used for generating code coverage reports

# Ensure the script exits if any command fails
set -euo pipefail

# Define the directories
SOURCE_DIR="services/frontend/src"
INSTRU_DIR="services/frontend/instrumented"

# Print status
echo -n "Instrumenting frontend code... "

# Create the instrumented directory if it does not exist
mkdir -p $INSTRU_DIR

# Instrument the code
nyc instrument --all --compact=false $SOURCE_DIR $INSTRU_DIR

# Copy remaining files without overwriting instrumented files
# 
# Images, CSS and other static files are not instrumended
# but they are still needed to run the application
rsync -av --quiet --ignore-existing $SOURCE_DIR/ $INSTRU_DIR/

# Print status
echo "Done!"
