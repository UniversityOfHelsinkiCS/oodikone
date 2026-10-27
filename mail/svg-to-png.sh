#!/usr/bin/env bash
set -Eeuo pipefail


convert -density 300 "$1".svg "$1".png
