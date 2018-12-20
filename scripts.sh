#!/bin/bash

BACKUP_DIR=backups
REPOS=repos
PSQL_DB_BACKUP="$BACKUP_DIR/latest-pg.bak"

init_dirs () {
    mkdir -p $REPOS $BACKUP_DIR
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

pull_git_repositories () {
    pushd $REPOS
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-backend.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-frontend.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodilearn.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodikone2-userservice.git
    popd
}

get_oodikone_server_backup() {
    scp -r -o ProxyCommand="ssh -W %h:%p melkki.cs.helsinki.fi" oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* "$BACKUP_DIR/"
}

unpack_oodikone_server_backup() {
    bunzip2 -d -v ./$BACKUP_DIR/*.bz2
}

restore_psql_from_backup () {
    cat $PSQL_DB_BACKUP | docker exec -i -u postgres oodi_db psql -d tkt_oodi
}

restore_mongodb_from_backup () {
    docker exec -t mongo_db mongorestore -d oodilearn "/dump"
}

db_oodikone_reset () {
    docker exec -u postgres oodi_db dropdb "tkt_oodi" || echo "dbdrop of tkt_oodi failed. "
    docker exec -u postgres oodi_db createdb "tkt_oodi" || echo "createdb of tkt_oodi failed. "
    restore_psql_from_backup
}

db_setup_full () {
    echo "Getting backups from the Oodikone server, this will prompt you for your password. "
    get_oodikone_server_backup
    echo "Unpacking compressed files"
    unpack_oodikone_server_backup
    echo "Restoring PostgreSQL from backup"
    restore_psql_from_backup
    echo "Restoring MongoDB from backup"
    restore_mongodb_from_backup
    echo "Database setup finished"
}

docker_build () {
    docker-compose up -d --build
}

show_instructions () {
    cat ./assets/instructions.txt
}

run_full_setup () {
    echo "Init dirs"
    init_dirs
    echo "Pull repos"
    pull_git_repositories
    echo "Building images, starting containers"
    docker_build
    echo "Setup oodikone db from dump, this will prompt you for your password."
    db_setup_full
    show_instructions
}
