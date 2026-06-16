#!/usr/bin/env bash

# This script will first make db dumps of the test environment and upload the dumps to staging


. ../scripts/utils.sh
set -euo pipefail

main() {
  declare -r db_names="sis-db kone-db user-db"
  declare -A db_url_names
  db_url_names["sis-db"]="SIS_DB_URL"
  db_url_names["kone-db"]="DB_URL_KONE"
  db_url_names["user-db"]="DB_URL_USER"

  declare -r dump_directory="dumps"

  # Takes the first db-tools pod
  check_oc_logged_staging
  db_tools_name=$(oc get pods -l app=db-tools --output jsonpath='{.items[0].metadata.name}')
  readonly db_tools_name


  create_dumps
  upload_and_migrate_dumps
}



function create_dumps() {
  echo "Starting test/anon containers..."
  (npm run docker:down && npm run both) || die "Failed to start containers"
  echo
  echo "Waiting for containers to start..."
  sleep 10 # wait for containers to start

  # Create dumps for all dbs
  echo
  echo "Creating dumps for $db_names"
  echo

  # Create dir if not exists
  if [ ! -d $dump_directory ]; then mkdir -p $dump_directory; fi

  for db in $db_names
  do
    create_dump_from_db "$db"
    if [ ! -f "$dump_directory/$db.sqz" ]; then die "Db dump not created"; fi
  done

  echo "Dumps can be found in $PWD/\*.sqz"
}


# $1 db-name
function create_dump_from_db() {
  echo "Dumping db $1..."

  docker exec "oodikone-$1" pg_dump -Fc -U postgres "$1" > "$dump_directory/$1.sqz" || die "Failed to dump db $1"
}


function check_oc_logged_staging() {
  echo -n "Checking if oc is logged into toska staging..."
  [[ $(oc config current-context) == "toska/api-ocp-test-0-k8s-it-helsinki-fi"* ]] || die "\nNot logged in to toska staging environment: $(oc config current-context)"
  echo " OK"
}


function upload_and_migrate_dumps() {

  local target_dump_directory="$db_tools_name:/tmp/oodikone-staging-dumps"
  echo -n "Dumping $dump_directory/ to $target_dump_directory..."
  oc rsync "$dump_directory/" "$target_dump_directory" 1> /dev/null # show errors
  echo " OK"
  echo

  for db in $db_names
  do
    migrate_dumps "$db"
  done
}


function migrate_dumps() {
  local db_url_b64
  local db_url_raw
  local db_url

  db_url_b64=$(oc get secrets -l app.kubernetes.io/instance=oodikone --output jsonpath="{.items[0].data.${db_url_names[$1]}}")
  db_url_raw=$(echo "$db_url_b64" | base64 --decode)
  db_url="${db_url_raw%\?*}"

  [[ $db_url != *"oodikone_*_test"* ]] || die "Trying to use non-test database: $db_url"

  echo "Migrating $1 to url: $db_url"

  oc exec "$db_tools_name" -- pg_restore --clean --no-owner -d "$db_url" "/tmp/oodikone-staging-dumps/$1.sqz"
}


# Run script
main
