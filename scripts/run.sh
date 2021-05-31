#!/bin/bash

# Fail fast if theres error when executing script
set -Eeuo pipefail

source ./scripts/scripts.sh

PS3='Please enter your choice: '

mopo () {
    if [ "$(tput cols)" -gt "100" ]; then
        cat scripts/assets/mopo2.txt
    fi
}

logo () {
    if [ "$(tput cols)" -gt "76" ]; then
        cat scripts/assets/logo.txt
    fi
}

logo
cat scripts/assets/welcome.txt

options=(
    "Set up oodikone with real data."
    "Download & reset all real data."
    "Download & reset sis importer data."
    "Download & reset old oodi data."
    "Quit."
)

while true; do
    select opt in "${options[@]}"; do
        case $opt in
            "Set up oodikone with real data.")
                mopo
                run_full_setup
                ;;
            "Download & reset all real data")
                run_full_real_data_reset
                ;;
            "Download & reset sis importer data.")
                run_importer_data_reset
                ;;
            "Download & reset old oodi data.")
                run_oodi_data_reset
                ;;
            "Quit.")
                break 2
                ;;
            *) echo "Invalid option $REPLY";;
        esac
        break
    done
done
