#!/usr/bin/env bash

# This script is used for instrumenting the frontend code
# Instrumented code is used for generating code coverage reports

# Ensure the script exits if any command fails
set -euo pipefail

# Define the directories
FRONTEND_SRC_DIR="services/frontend/src"
FRONTEND_INSTRUMENTED_DIR="services/frontend/instrumented"

# Create instrumented directories if they don't exist
mkdir -p $FRONTEND_INSTRUMENTED_DIR

# Copy all files from src to instrumented directory
cp -r $FRONTEND_SRC_DIR/* $FRONTEND_INSTRUMENTED_DIR

# Instrument the copied code
nyc instrument --in-place --compact=false $FRONTEND_INSTRUMENTED_DIR $FRONTEND_INSTRUMENTED_DIR
