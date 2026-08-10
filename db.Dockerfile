FROM postgres:15.10

# Remember to define this variable
ARG DB_NAME
ENV DB_NAME=$DB_NAME

ENV PGDATA=/data
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_HOST_AUTH_METHOD=trust
ENV POSTGRES_DB=$DB_NAME

# RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends pgcli

COPY ./.databasedumps/test/$DB_NAME.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
HEALTHCHECK --interval=30s --timeout=5s --retries=10 --start-interval=3s --start-period=15s \
  CMD pg_isready -U postgres -h 127.0.0.1
