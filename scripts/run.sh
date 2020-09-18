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
    "e2e setup"
    "Anon setup"
    "Full setup"
    "Reset anon DB"
    "Reset real DB"
    "Download latest anon DB"
    "Download latest real DB"
    "Setup SIS data"
    "Quit"
)

while true; do
    select opt in "${options[@]}"; do
        case $opt in
            "e2e setup")
                mopo
                run_e2e_setup ./docker/docker-compose.lateste2e.yml staging
                ;;
            "Anon setup")
                mopo
                run_anon_full_setup
                ;;
            "Full setup")
                mopo
                run_full_setup
                ;;
            "Reset anon DB")
                reset_db
                ;;
            "Reset real DB")
                reset_real_db
                ;;
            "Download latest anon DB")
                get_anon_oodikone
                ;;
            "Download latest real DB")
                get_oodikone_server_backup
                ;;
            "Setup SIS data")
                ./scripts/populate-db.sh
                ;;
            "Quit")
                break 2
                ;;
            *) echo "Invalid option $REPLY";;
        esac
        break
    done
done
