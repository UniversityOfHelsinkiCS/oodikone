#!/bin/bash

DATA=data
REPOS=repos
DB_BACKUP=data/staging.bak
MONGO_DATA=data/

init_dirs () {
    mkdir -p $DATA $REPOS
}

echo_path () {
    echo $(pwd)
}

purge () {
    git clean -f -fdX
    docker-compose down
}

megapurge () {
    git clean -f -fdX
    docker stop $(docker ps -q)
    docker container prune
    docker rmi $(docker images -q)
}

pull () {
    pushd $REPOS
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-backend.git
    git clone -b trunk https://github.com/UniversityOfHelsinkiCS/oodikone2-frontend.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodilearn.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodikone2-userservice.git
    popd
}

get_oodikone_dump () {
    scp oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/staging.bak $DB_BACKUP
}

db_oodikone_restore () {
    cat $DB_BACKUP | docker exec -i -u postgres oodi_db psql -d tkt_oodi
}

db_oodikone_reset () {
    docker exec -u postgres oodi_db dropdb "tkt_oodi"
    docker exec -u postgres oodi_db createdb "tkt_oodi"
    cat $DB_BACKUP | docker exec -i -u postgres oodi_db psql -d tkt_oodi
}

db_oodilearn_restore () {
    docker exec -t mongo_db mongorestore -d oodilearn /dump/oodilearn
}

install_oodilearn () {
    docker build repos/oodilearn/server -t oodilearn
    docker build repos/oodilearn/training
}

setup_oodilearn () {
    pushd repos/oodilearn
    mkdir -p models
    popd
}

setup_oodilearn_db () {
    docker-compose -f oodilearn-compose.yml up -d mongo_db
}

restore_mongodb () {
    docker exec -it mongo_db mongorestore -d oodilearn /dump/oodilearn
}

get_mongo_dump () {
    scp -r oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/mongo/oodilearn $MONGO_DATA
}

install_backend () {
    pushd repos/oodikone2-backend
    npm install
    popd
}

install_frontend () {
    pushd repos/oodikone2-frontend
    npm install
    popd
}

setup_docker () {
    docker-compose up -d
}

docker_build () {
    docker-compose up -d
}

db_setup_oodikone () {
    get_oodikone_dump && db_oodikone_restore || echo "Oodikone db setup failed."
}

db_setup_oodilearn () {
    get_mongo_dump && db_oodilearn_restore || echo "OodiLearn db setup failed."
}

run_full_setup () {
    echo "Purging directory"
    purge
    echo "Init dirs"
    init_dirs
    echo "Pull repos"
    pull
    echo "Building images, starting containers"
    docker_build
    echo "Setup oodikone db from dump, this will prompt you for your password."
    db_setup_oodikone
    echo "Setup oodilearn db from dump, this will prompt you for your password."
    db_setup_oodilearn
}

run_setup () {
  echo "Creating directories."
}

cd $(dirname "$0")
