#!/bin/bash

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
    "Download & reset all real data"
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
            "Set up importer-db from importer-duplicate.")
                run_importer_setup_with_duplicate
                ;;
            "Download & reset all real data")
                run_full_real_data_reset
                ;;
            "Quit.")
                break 2
                ;;
            *) echo "Invalid option $REPLY";;
        esac
        break
    done
done
