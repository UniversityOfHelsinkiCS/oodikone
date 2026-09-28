#!/usr/bin/env bash

# Create the s3 bucket used for the test database dumps, if it doesn't exist yet.
# Doing nothing when the bucket is already there, so this is safe to run every time.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR"/lib/common.sh

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0")

Creates the bucket $S3_BUCKET if it doesn't exist yet, and does nothing if it does.
EOF
}

if [[ "${1-}" == "-h" || "${1-}" == "--help" ]]; then
  usage
  exit 0
fi

require_s3_config

# s3cmd info exits with an error when the bucket doesn't exist
if s3 info "$S3_BUCKET" > /dev/null 2>&1; then
  infomsg "Bucket $S3_BUCKET already exists"
  exit 0
fi

warningmsg "Bucket $S3_BUCKET doesn't exist, creating it"
s3 mb "$S3_BUCKET"
successmsg "Created bucket $S3_BUCKET"
