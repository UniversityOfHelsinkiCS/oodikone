#!/bin/sh
# Sh is default shell for postgres docker images

# Fail immediately if script fails or unbound variables are referenced
set -eu

create_user_and_database() {
	database=$1
	echo "Creating user and database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	  CREATE USER $database;
	  CREATE DATABASE $database;
	  GRANT ALL PRIVILEGES ON DATABASE $database TO $database;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
		create_user_and_database "$db"
	done
	echo "Multiple databases created"
fi
