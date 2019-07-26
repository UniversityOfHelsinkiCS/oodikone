#!/bin/bash

source ./scripts.sh

PS3='Please enter your choice: '

mopo () {
    if [ $(tput cols) -gt "100" ]; then
        cat assets/mopo2.txt
    fi
}

logo () {
    if [ $(tput cols) -gt "100" ]; then
        cat assets/logo.txt
    fi
}

logo

options=(
    "e2e setup"
    "Anon setup"
    "Full setup"
    "Reset anon db"
    "Reset real db"
    "Download latest anon db"
    "Download latest real db"
    "Quit"
)
select opt in "${options[@]}"
do
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
        "Reset anon db")
            reset_db
            ;;
        "Reset real db")
            reset_real_db
            ;;
        "Download latest anon db")
            get_anon_oodikone
            ;;
        "Download latest real db")
            get_oodikone_server_backup
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
