#!/bin/bash

parse_and_diff() {
  source_file=`echo "$1" | awk -F'/' '{print $NF}'`
  target_file_path="${target_folder}/${source_file}"
  printf "\nDIFF $entry $target_file_path:\n\n"
  [ ! -f $target_file_path ] || diff $1 $target_file_path
}

export source_folder=$1
export target_folder=$2
export N_P=`getconf _NPROCESSORS_ONLN`
export -f parse_and_diff

exec_parallel() {
  parallel --group parse_and_diff ::: `find $source_folder -type f -print`
}

exec_serial() {
  for entry in "$source_folder"/*
  do
    parse_and_diff $entry
  done
}

command -v parallel >/dev/null 2>&1 && exec_parallel || exec_serial
