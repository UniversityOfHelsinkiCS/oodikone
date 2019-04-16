#!/bin/bash

DIR_PATH=$(dirname "$0")
BACKUP_DIR=backups
REPOS=repos
PSQL_DB_BACKUP="$BACKUP_DIR/latest-pg.bak"
USER_DB_BACKUP="$BACKUP_DIR/latest-user-pg.bak"

retry () {
    for i in {1..10}
    do
        $@ && break || echo "Retry attempt $i failed, waiting..." && sleep 10;
    done
}

init_dirs () {
    mkdir -p $REPOS $BACKUP_DIR nginx nginx/cache nginx/letsencrypt
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

pull_git_repositories () {
    pushd $REPOS
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-backend.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-frontend.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodilearn.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-usageservice.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-userservice.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-analytics.git
    popd
}

pull_e2e_git_repositories () {
    pushd $REPOS
    BRANCH=trunk
    if [[ $TRAVIS_BRANCH =~ (^master) ]]; then
        BRANCH=master
    fi
    git clone -b $BRANCH https://github.com/UniversityOfHelsinkiCS/oodikone2-backend.git
    git clone -b $BRANCH https://github.com/UniversityOfHelsinkiCS/oodikone2-userservice.git
    popd
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
    GIT_SSH_COMMAND='ssh -i private.key' git clone git@github.com:UniversityOfHelsinkiCS/anonyymioodi.git
    mv anonyymioodi/anon.bak.bz2 ./$BACKUP_DIR/latest-pg.bak.bz2
    mv anonyymioodi/user-dump.bak.bz2 ./$BACKUP_DIR/latest-user-pg.bak.bz2

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
    echo "Pinging psql in container $1 with db name $2"
    docker exec -u postgres oodi_db psql -c "CREATE DATABASE tkt_oodi"
    retry docker exec -u postgres $1 pg_isready
}

db_setup_full () {
    echo "Getting backups from the Oodikone server, this will prompt you for your password. "
    get_oodikone_server_backup
    echo "Unpacking compressed files"
    unpack_oodikone_server_backup
    echo "Restoring PostgreSQL from backup"
    ping_psql "oodi_db" "tkt_oodi"
    retry restore_psql_from_backup
    echo "Restoring MongoDB from backup"
    retry restore_mongodb_from_backup
    echo "Restore user db from backup"
    ping_psql "oodi_user_db" "user_db"
    retry restore_userdb_from_backup
    echo "Database setup finished"
}

db_anon_setup_full () {
    echo "Getting anon backups from the private repository. "
    get_anon_oodikone
    echo "Unpacking compressed files"
    unpack_oodikone_server_backup
    echo "Restoring PostgreSQL from backup"
    ping_psql "oodi_db" "tkt_oodi"
    retry restore_psql_from_backup
    echo "Restoring MongoDB from backup"
    retry restore_mongodb_from_backup
    echo "Restore user db from backup"
    ping_psql "oodi_user_db" "user_db"
    retry restore_userdb_from_backup
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

docker_restart_backend () {
    docker-compose restart backend userservice
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
    echo "Restarting Docker backend containers to run migrations, etc."
    docker_restart_backend
    show_instructions
}
run_anon_full_setup () {
    echo "Init dirs"
    init_dirs
    echo "Pull repos"
    pull_git_repositories
    echo "Building images, starting containers"
    docker_build
    echo "Setup oodikone db from dump, this will prompt you for your password."
    db_anon_setup_full
    echo "Adding git-hooks to projects"
    create_symlink_git_hooks
    echo "Restarting Docker backend containers to run migrations, etc."
    docker_restart_backend
    show_instructions
}

run_e2e_setup () {
    echo "Init dirs"
    init_dirs
    echo "Building images, starting containers"
    docker-compose -f docker-compose.lateste2e.yml pull && docker-compose -f docker-compose.lateste2e.yml up -d
    echo "Installing Cypress"
    npm i -g cypress@^3.1.5 --silent
    echo "Setup oodikone db from dump, this will prompt you for your password."
    db_anon_setup_full
    echo "Restarting Docker backend containers to run migrations, etc."
    docker-compose -f docker-compose.lateste2e.yml restart backend userservice


}
