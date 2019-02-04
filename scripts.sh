#!/bin/bash

DIR_PATH=$(dirname "$0")
BACKUP_DIR=backups
REPOS=repos
PSQL_DB_BACKUP="$BACKUP_DIR/latest-pg.bak"
USER_DB_BACKUP="$BACKUP_DIR/latest-user-pg.bak"

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
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-userservice.git
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

restore_userdb_from_backup () {
    cat $USER_DB_BACKUP | docker exec -i -u postgres oodi_user_db psql -d user_db
}

restore_mongodb_from_backup () {
    docker exec -t mongo_db mongorestore -d oodilearn "/dump"
}

db_oodikone_reset () {
    docker exec -u postgres oodi_db dropdb "tkt_oodi" || echo "dbdrop of tkt_oodi failed. "
    docker exec -u postgres oodi_db createdb "tkt_oodi" || echo "createdb of tkt_oodi failed. "
    restore_psql_from_backup
}

ping_psql () {
    echo "Pinging psql in container $1"
    for i in 1 2 3 4 5; do docker exec -u postgres $1 pg_isready && break || echo "Waiting..." && sleep 10; done
}

db_setup_full () {
    echo "Getting backups from the Oodikone server, this will prompt you for your password. "
    get_oodikone_server_backup
    echo "Unpacking compressed files"
    unpack_oodikone_server_backup
    echo "Restoring PostgreSQL from backup"
    ping_psql "oodi_db"
    restore_psql_from_backup
    echo "Restoring MongoDB from backup"
    echo "Restore user db from backup"
    ping_psql "oodi_user_db"
    restore_userdb_from_backup
    restore_mongodb_from_backup
    echo "Database setup finished"
}

docker_build () {
    docker-compose up -d --build
}

create_symlink_git_hooks () {
    ln -f "$DIR_PATH/git-hooks/frontend/pre-push" repos/oodikone2-frontend/.git/hooks/pre-push
    ln -f "$DIR_PATH/git-hooks/backend/pre-push" repos/oodikone2-backend/.git/hooks/pre-push
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
    echo "Adding git-hooks to projects"
    create_symlink_git_hooks
    show_instructions
}
