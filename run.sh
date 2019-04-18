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
    "e2e setup"
    "Anon setup"
    "Full setup"
    "Full reset"
    "Quit"
)
select opt in "${options[@]}"
do
    case $opt in
        "e2e setup")
            mopo
            run_e2e_setup
            ;;
        "Anon setup")
            mopo
            run_anon_full_setup
            ;;
        "Full setup")
            mopo
            run_full_setup
            ;;
        "Full reset")
            purge
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
