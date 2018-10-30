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

options=("Full setup" "Full reset" "Reset db" "Get db dump" "Reset env" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Full setup")
            mopo
            run_setup
            ;;
        "Full reset")
            purge
            ;;
        "Reset db")
            db_drop_create_dump
            ;;
        "Get db dump")
            get_dump
            ;;
        "Reset env")
            copyenv
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
