#!/bin/bash

source scripts.sh

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
    "Full setup"
    "Full reset"
    "Get OK dump"
    "Reset OK db"
    "Get OL dump"
    "Reset OL db"
    "Quit"
)
select opt in "${options[@]}"
do
    case $opt in
        "Full setup")
            mopo
            run_full_setup
            ;;
        "Full reset")
            purge
            ;;
        "Get OK dump")
            get_oodikone_dump
            ;;
        "Reset OK db")
            db_oodikone_reset
            ;;
        "Get OL dump")
            get_mongo_dump
            ;;
        "Reset OL db")
            restore_mongodb
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
