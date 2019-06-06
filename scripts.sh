#!/bin/bash

DIR_PATH=$(dirname "$0")
ANONDB_DIR=anonyymioodi
BACKUP_DIR=backups
PSQL_DB_BACKUP="$ANONDB_DIR/anon.sqz"
USER_DB_BACKUP="$ANONDB_DIR/user-dump.sqz"
PSQL_REAL_DB_BACKUP="$BACKUP_DIR/latest-pg.sqz"
USER_REAL_DB_BACKUP="$BACKUP_DIR/latest-user-pg.sqz"

retry () {
    for i in {1..60}
    do
        $@ && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
    done
}

init_dirs () {
    mkdir -p $BACKUP_DIR nginx nginx/cache nginx/letsencrypt
    touch nginx/error.log
    touch nginx/log
}

echo_path () {
    echo $(pwd)
}

purge () {
    docker-compose down || echo "docker-compose down failed"
    git clean -f -fdX
}

megapurge () {
    git clean -f -fdX
    docker stop $(docker ps -q)
    docker container prune
    docker rmi $(docker images -q)
}

get_oodikone_server_backup() {
    scp -r -o ProxyCommand="ssh -W %h:%p melkki.cs.helsinki.fi" oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"
}

get_anon_oodikone() {
    file=./private.key
    if [ -e "$file" ]; then
      echo "Private key exists"
    else
      echo "No private key, echoing from environment variable OODI_KEY"
      echo "$OODI_KEY" | awk  '{gsub("\\\\n","\n")};1' > private.key
      chmod 400 private.key
    fi
    rm -rf anonyymioodi
    GIT_SSH_COMMAND='ssh -i private.key' git clone git@github.com:UniversityOfHelsinkiCS/anonyymioodi.git
}

restore_psql_from_backup () {
    time pg_restore -U postgres -h localhost -p 5421 --no-owner -F c --dbname=tkt_oodi -j4 $PSQL_DB_BACKUP
}

restore_real_psql_from_backup () {
    time pg_restore -U postgres -h localhost -p 5421 --no-owner -F c --dbname=tkt_oodi_real -j4 $PSQL_REAL_DB_BACKUP
}

restore_userdb_from_backup () {
    time pg_restore -U postgres -h localhost -p 5422 --no-owner -F c --dbname=user_db -j4 $USER_DB_BACKUP
}

restore_real_userdb_from_backup () {
    time pg_restore -U postgres -h localhost -p 5422 --no-owner -F c --dbname=user_db_real -j4 $USER_REAL_DB_BACKUP
}

# oodilearn
# restore_mongodb_from_backup () {
#     docker exec -t mongo_db mongorestore -d oodilearn "/dump"
# }

ping_psql () {
    echo "Pinging psql in container $1 with db name $2"
    retry docker exec -u postgres $1 pg_isready --dbname=$2
    docker exec -u postgres $1 psql -c "CREATE DATABASE $2" || echo "container $1 DB $2 already exists"
}

db_setup_full () {
    echo "Restoring PostgreSQL from backup"
    retry restore_real_psql_from_backup
    # echo "Restoring MongoDB from backup"
    # retry restore_mongodb_from_backup
    echo "Restore user db from backup"
    ping_psql "oodi_user_db" "user_db_real"
    retry restore_real_userdb_from_backup
    echo "Database setup finished"
}

db_anon_setup_full () {
    echo "Restoring PostgreSQL from backup"
    ping_psql "oodi_db" "tkt_oodi"
    ping_psql "oodi_db" "tkt_oodi_test"
    retry restore_psql_from_backup
    # echo "Restoring MongoDB from backup"
    # retry restore_mongodb_from_backup
    echo "Restore user db from backup"
    ping_psql "oodi_user_db" "user_db"
    retry restore_userdb_from_backup
    echo "Database setup finished"
}

reset_real_db () {
    docker-compose down
    docker-compose up -d db user_db
    ping_psql "oodi_db" "tkt_oodi_real"
    docker exec -u postgres oodi_db dropdb "tkt_oodi_real"
    ping_psql "oodi_user_db" "user_db_real"
    docker exec -u postgres oodi_user_db dropdb "user_db_real"
    db_setup_full
    docker-compose down
}

reset_db () {
    docker-compose down
    docker-compose up -d db user_db
    ping_psql "oodi_db" "tkt_oodi"
    docker exec -u postgres oodi_db dropdb "tkt_oodi"
    ping_psql "oodi_db" "tkt_oodi_test"
    docker exec -u postgres oodi_db dropdb "tkt_oodi_test"
    ping_psql "oodi_user_db" "user_db"
    docker exec -u postgres oodi_user_db dropdb "user_db"
    db_anon_setup_full
    docker-compose down
}

install_cli_npm_packages () {
    npm ci
}

docker_build () {
    docker-compose up -d --build
}

show_instructions () {
    cat ./assets/instructions.txt
}

run_full_setup () {
    echo "Setup npm packages"
    install_cli_npm_packages
    echo "Init dirs"
    init_dirs
    echo "Getting backups from the Oodikone server, this will prompt you for your password. "
    get_oodikone_server_backup
    echo "Getting anon backups from the private repository. "
    get_anon_oodikone
    echo "Building images"
    docker-compose build
    echo "Setup oodikone db from dump."
    docker-compose up -d db user_db
    db_setup_full
    db_anon_setup_full
    docker-compose down
    show_instructions
}

run_anon_full_setup () {
    echo "Setup npm packages"
    install_cli_npm_packages
    echo "Init dirs"
    init_dirs
    echo "Getting anon backups from the private repository. "
    get_anon_oodikone
    echo "Building images"
    docker-compose build
    echo "Setup oodikone db from dump."
    docker-compose up -d db user_db
    db_anon_setup_full
    docker-compose down
    show_instructions
}

run_e2e_setup () {
    echo "Setup npm packages"
    install_cli_npm_packages
    echo "Init dirs"
    init_dirs
    echo "Getting anon backups from the private repository. "
    get_anon_oodikone
    echo "Building images"
    docker-compose -f $1 build
    echo "Setup oodikone db from dump."
    docker-compose -f $1 up -d db user_db
    db_anon_setup_full
    echo "Starting services."
    docker-compose -f $1 up -d
}
