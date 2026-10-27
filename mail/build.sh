#!/usr/bin/env bash
set -Eeuo pipefail

FILENAME="template"

tectonic -X compile -Z search-path="$(dirname "$(kpsewhich biblatex.sty)")" --synctex --keep-logs --keep-intermediates $FILENAME.tex
