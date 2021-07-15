#!/usr/bin/env bash

# This script is used to setup oodikone with interactive cli. Base for script:
# https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Fail immediately if script fails, unbound variables are referenced
# or command inside pipe fails. -E ensures cleanup trap fires in rare ERR cases.
set -euoE pipefail

# Set up constants
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Source functions for setup
source "$PROJECT_ROOT"/scripts/functions_for_setup.sh

# Try to run cleanup function if things fail.
trap cleanup SIGINT SIGTERM ERR EXIT

# Run docker-compose down on cleanup
cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  warningmsg "Trying to run docker-compose down and remove orphans"
  docker-compose down --remove-orphans
}

# === CLI ===

show_welcome() {
  local cashmoneyyellow
  cashmoneyyellow=$(tput setaf 221)
  local normal
  normal=$(tput sgr0)
  if [ "$(tput cols)" -gt "76" ]; then
    while IFS="" read -r p || [ -n "$p" ]; do
      printf '%40s\n' "${cashmoneyyellow}$p${normal}"
    done < "$PROJECT_ROOT"/scripts/assets/logo.txt
  fi
  infomsg "Welcome to Oodikone CLI!"
  msg "This tool helps you in managing the project configuration. If you are new to
Oodikone development, you should probably run \"Set up oodikone from scratch.\" which
will take care of setting up Oodikone for you. See README for more details."
  msg ""
}

# Define custom shell prompt for the interactive select loop
PS3="Please enter your choice: "

options=(
  "Set up oodikone from scratch."
  "Reset all real data."
  "Reset sis-importer data."
  "Reset old oodi data."
  "Quit."
)

# Run scripts before showing interactive prompt
show_welcome
init_dirs
get_username

while true; do
  select opt in "${options[@]}"; do
    case $opt in
      "Set up oodikone from scratch.")
        set_up_oodikone_from_scratch;;
      "Reset all real data.")
        reset_all_real_data;;
      "Reset sis-importer data.")
        reset_sis_importer_data;;
      "Reset old oodi data.")
        reset_old_oodi_data;;
      "Quit.")
        break 2;;
      *) msg "${RED}Invalid option:${NOFORMAT} $REPLY
";;
    esac
    break
  done
done
