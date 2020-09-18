#!/bin/bash

if test $# -eq 0; then
  # Run interactive CLI.
  scripts/run.sh
else
  while test $# -gt 0; do
    case "$1" in
      -h|--help)
        echo "Oodikone CLI"
        echo " "
        echo "./oodikone.sh [options]"
        echo " "
        echo "options:"
        echo "-h, --help                Show help."
        echo "-m, --morning             Run this every morning 🌞"
        echo "                          Purges, updates, rebuilds and restarts the whole shebang."
        exit 0
        ;;
      -m|--morning)
        scripts/morning.sh
        exit 0
        ;;
      *)
        echo "Unknown option. See ./oodikone.sh --help."
        break
        ;;
    esac
  done
fi
