#!/usr/bin/env bash

# Oodikone CLI tool (revision 2.0)
# Bash template provided by:
# https://betterdev.blog/minimal-safe-bash-script-template/

set -Eueo pipefail
trap cleanup SIGINT SIGTERM ERR EXIT

# Constants
# Resolve relative to the script's own location (not the caller's cwd), so
# `ok.sh` behaves the same whether it's run as `./ok.sh` from the repo or
# invoked with an absolute/symlinked path from anywhere (e.g. the `ok`
# shell function installed via `./ok.sh install`).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel)"

cd "$PROJECT_ROOT"

# Include scripts from other sources
source "$PROJECT_ROOT"/scripts/functions_for_setup.sh

usage() {
  cat << EOF # remove the space between << and EOF, this is due to web plugin issue
Usage: $(basename "${BASH_SOURCE[0]}") [command]

Run without a command to open the interactive menu.

Available commands:

  up, u             Start Oodikone with real data
  rs                Restart Oodikone with real data (down, then up)
  test, t           Start Oodikone with test/anon data
  down, d           Stop Oodikone
  logs, l           Follow oodikone service logs
  logs:updater, lu  Follow sis-updater service logs
  importer, i       Open a psql/pgcli shell to the importer database
  updater           Open a psql/pgcli shell to the updater (sis) database
  install           Add the 'ok' shell function to your shell rc file
  -h, --help        Print this help and exit
EOF
  exit
}

cleanup() {
  trap - SIGINT SIGTERM ERR EXIT
  msg ""
  errormsg "(╯°□°)╯︵ ┻━┻"
}

setup_colors() {
  if [[ -t 2 ]] && [[ -z "${NO_COLOR-}" ]] && [[ "${TERM-}" != "dumb" ]]; then
    NOFORMAT='\033[0m' RED='\033[0;31m' GREEN='\033[0;32m' ORANGE='\033[0;33m' BLUE='\033[0;34m'
  else
    NOFORMAT='' RED='' GREEN='' ORANGE='' BLUE=''
  fi
}

die() {
  local msg=$1
  local code=${2-1} # default exit status 1
  msg "$msg"
  exit "$code"
}

get_pgclient() {
  if command -v pgcli >/dev/null 2>&1; then
    echo "pgcli"
  else
    warningmsg "Couldn't verify pgcli installation, using psql as fallback" >&2
    echo "psql"
  fi
}

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
  msg "Welcome to Oodikone CLI!"
  msg ""
}

main_menu_opts() {
  msg "1) Start Oodikone    2) Databases    3) Data refresh    4) Setup    q) Quit\n"
}

database_menu_opts() {
  msg "\nView local databases ($datasource data)"
  msg "suffix: $dbsuffix"
  msg "1) Oodikone"
  msg "2) Importer"
  msg "3) Toggle data source (test/real)"
  msg "4) Go back"
  msg ""
}

database_menu() {
  # If a single mandatory service is down, an assumption is made that they all are.
  if ! docker compose ps 2>/dev/null | grep -q 'oodikone-backend'; then
    msg ""
    warningmsg "Can't access databases, oodikone is not running!\nPlease run option 1 first with preferred data source."
    return
  fi


  declare dbsuffix="-real"
  declare datasource="real"

  toggle_environment() {
    if [[ $dbsuffix = "" ]];
      then
        dbsuffix="-real"
        datasource="real"
      else
        dbsuffix=""
        datasource="test"
    fi
  }

  local pgclient
  pgclient="$(get_pgclient)"
  msg "${GREEN}\nUsing $pgclient for database connections${NOFORMAT}"
  database_menu_opts $datasource

  local userinput
  while true; do
    read -r -s -n 1 -p "Please select an option: " userinput

    case ${userinput} in
      1|o|O)
        msg "Oodikone-db"
        $pgclient -h localhost -p 12345 -U postgres -d "sis-db$dbsuffix" -w
        database_menu_opts
        ;;
      2|i|I)
        msg "Importer-db"
        $pgclient -h localhost -p 12346 -U postgres -d "sis-importer-db$dbsuffix" -w
        database_menu_opts
        ;;
      3|t|T)
        msg "Toggling environment..."
        database_menu_opts
        ;;
      4|q|Q)
        msg ""
        break
        ;;
      *)
        true
        ;;
    esac
  done
}

main_loop() {
  local userinput

  while true; do
    main_menu_opts
    read -r -s -n 1 -p "Please select an option: " userinput

    case ${userinput} in
      1)
        msg "\nTODO: todo\n";;
      2)
        database_menu;;
      3)
        msg "\nTODO: todo\n";;
      4)
        msg "\nTODO: todo\n";;
      5|q|Q)
        break 2;;
      *)
        errormsg "${RED}Invalid option:${NOFORMAT} $userinput";;
    esac
  done
}

# === Direct (non-interactive) commands ===
run_up() {
  infomsg "Starting Oodikone with real data..."
  npm run both:real
}

run_restart() {
  infomsg "Restarting Oodikone with real data..."
  npm run docker:down
  npm run both:real
}

run_test() {
  infomsg "Starting Oodikone with test data..."
  npm run both
}

run_down() {
  infomsg "Stopping Oodikone..."
  npm run docker:down
}

run_logs() {
  npm run logs
}

run_logs_updater() {
  docker compose --file docker-compose.yml logs sis-updater-worker sis-updater-scheduler -f
}

run_importer_db() {
  local pgclient
  pgclient="$(get_pgclient)"
  msg "Importer-db"
  $pgclient -h localhost -p 12346 -U postgres -d sis-importer-db-real -w
}

run_updater_db() {
  local pgclient
  pgclient="$(get_pgclient)"
  msg "Updater-db"
  $pgclient -h localhost -p 12345 -U postgres -d sis-db-real -w
}

# Add (or refresh) an `ok` shell function in the user's shell rc file, which
# simply forwards all arguments to this script. This is the one-time setup
# step referenced above the shell function no longer needs its own copy of
# oodikone-specific logic.
cmd_install() {
  local shell_name
  shell_name="$(basename "${SHELL:-bash}")"

  local shell_rc
  case "$shell_name" in
    zsh) shell_rc="$HOME/.zshrc" ;;
    *) shell_rc="$HOME/.bashrc" ;;
  esac

  local ok_path="$PROJECT_ROOT/ok.sh"
  local marker_start="# >>> oodikone ok.sh >>>"
  local marker_end="# <<< oodikone ok.sh <<<"

  if [ -f "$shell_rc" ] && grep -qF "$marker_start" "$shell_rc"; then
    warningmsg "ok.sh integration already present in $shell_rc, skipping."
    infomsg "To reinstall (e.g. after moving the repo), remove the block between\n'$marker_start' and '$marker_end' in $shell_rc and re-run 'ok.sh install'."
    return 0
  fi

  {
    echo ""
    echo "$marker_start"
    echo "ok() { \"$ok_path\" \"\$@\"; }"
    echo "$marker_end"
  } >> "$shell_rc"

  successmsg "Added the 'ok' function to $shell_rc"
  infomsg "Run 'source $shell_rc' or restart your shell, then try 'ok up'."
}

# Main
setup_colors

case "${1-}" in
  up|u)
    shift
    run_up "$@"
    ;;
  rs)
    shift
    run_restart "$@"
    ;;
  test|t)
    shift
    run_test "$@"
    ;;
  down|d)
    shift
    run_down "$@"
    ;;
  logs|l)
    shift
    run_logs "$@"
    ;;
  logs:updater|lu)
    shift
    run_logs_updater "$@"
    ;;
  importer|i)
    shift
    run_importer_db
    ;;
  updater)
    shift
    run_updater_db
    ;;
  install)
    shift
    cmd_install
    ;;
  -h|--help)
    usage
    ;;
  "")
    show_welcome
    get_s3_config
    main_loop
    ;;
  *)
    errormsg "Unknown command: $1"
    usage
    ;;
esac
