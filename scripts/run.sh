#!/bin/bash

source ./scripts/scripts.sh

PS3='Please enter your choice: '

mopo () {
    if [ $(tput cols) -gt "100" ]; then
        cat scripts/assets/mopo2.txt
    fi
}

logo () {
    if [ $(tput cols) -gt "76" ]; then
        cat scripts/assets/logo.txt
    fi
}

logo
cat scripts/assets/welcome.txt

options=(
    "Set up with anonymous data."
    "Set up with real data."
    "Reset anonymous database."
    "Reset real data database."
    "Download latest anonymous data."
    "Download latest real data."
    "Set up importer-db."
    "Quit."
)

while true; do
    select opt in "${options[@]}"; do
        case $opt in
            "Set up with anonymous data.")
                mopo
                run_anon_full_setup
                ./scripts/populate-db.sh
                ;;
            "Set up with real data.")
                mopo
                run_full_setup
                ;;
            "Reset anonymous database.")
                reset_db
                #./scripts/populate-db.sh
                ;;
            "Reset real data database.")
                reset_real_db
                ;;
            "Download latest anonymous data.")
                get_anon_oodikone
                ;;
            "Download latest real data.")
                get_oodikone_server_backup
                ;;
            "Set up importer-db.")
                run_importer_setup
                ;;
            "Quit.")
                break 2
                ;;
            *) echo "Invalid option $REPLY";;
        esac
        break
    done
done
