# oodikone

[![CircleCI](https://circleci.com/gh/UniversityOfHelsinkiCS/oodikone/tree/master.svg?style=svg)](https://circleci.com/gh/UniversityOfHelsinkiCS/oodikone/tree/master)

An application for analyzing university data. The entire development environment runs in a Docker network that's defined in the `docker-compose.yml` file. The specifics of what this means for setting up the environment and accessing logs is discussed in a later section.

## Requirements

To run Oodikone locally, you will need the following:

1. [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) running on your system.
2. Membership of [Toska's Github organisation](https://github.com/UniversityOfHelsinkiCS).
3. Local clone of this repository.
4. Run the CLI (see [Installation](#Installation))

## Installation

Launch the CLI and follow the instructions:

```bash
./scripts/run.sh
```

For local development with anonymized data use `2) Anon setup` (you can run e2e tests with this).

To get also the full real dataset use `3) Full setup`

> `1) e2e setup` is designed for use in CircleCI. But you can still try it locally if you want to.

Run E2E tests in with `npm run cypress:run` or `npm run cypress:open` with visual browser.

The acual oodikone starts to http://localhost:8081/

On a fresh install, some features do not work because redis is empty.  
To populate redis, navigate to http://localhost:8081/updater, and press the 'refresh statistics' -button.

## What the CLI does

- Builds and runs the Dockerized development environment
- Gets a database dump from production servers
- Creates the database schema and populates it with the dump
- Adds git-hooks

## Docker commands

The development environment is entirely configured in the docker-compose.yml file located in this repository. The file defines the containers/environments for:

- Frontend
- Backend
- Userservice
- The databases used by the services
- Adminer & other dev tools

The mapping of ports and environment variables are also defined in the docker-compose file. You can start, stop and manage the development environment by running the following commands from a terminal shell in this directory.

### Start the development environment

#### With anonymized data:

```bash
npm start
```

#### With real data:

```bash
npm run start:real
```

OR

```bash
docker-compose -f docker-compose.yml -f ./docker/docker-compose.dev.yml -f ./docker/docker-compose.dev.real.yml up -d
```

### Stop the development environment

```bash
npm run docker:down
```

### Restart container(s)

```bash
npm run docker:restart          # all

npm run docker:restart:backend  # just backend
```

### View the containers in the running environment

```bash
docker-compose ps
```

### View logs

```bash
npm run docker:logs          # all

npm run docker:logs:backend  # just backend
```

### Attach a terminal shell to a container

```bash
docker exec -it backend bash

docker exec -it <container> <command>
```

### Use `psql` or other database CLI tools

```bash
docker exec -it -u postgres oodi_db psql -d tkt_oodi

docker exec -it -u <username> <container> psql -d <db name>
```

## Other commands

### How to `scp` backup files from oodikone via melkki-proxy

This is how the setup script fetches the database dump from production servers. It will require you to have access to both melkki.cs.helsinki.fi as well as oodikone.cs.helsinki.fi. The command uses `scp` to transfer all backup files recursively from a known location on the production server by using the melkki server as a proxy, allowing you to get the dump even when you're not connected to the university network.

#### Command

```bash
scp -r -o ProxyCommand="ssh -W %h:%p melkki.cs.helsinki.fi" oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* ./backups/

-r : recursively copy files
-o : options for defining the proxy command
```

#### [Unix StackExchange answer](https://unix.stackexchange.com/questions/355640/how-to-scp-via-an-intermediate-machine)

> It's possible and relatively easy, even when you need to use certificates > for authentication (typical in AWS environments).
>
> The command below will copy files from a remotePath on server2 directly > into your machine at localPath. Internally the scp request is proxied via > server1.
>
> ```bash
> scp -i user2-cert.pem -o ProxyCommand="ssh -i user1-cert.pem -W %h:%p > user1@server1" user2@server2:/<remotePath> <localpath>
> ```
>
> If you use password authentication instead, try with:
>
> ```bash
> scp -o ProxyCommand="ssh -W %h:%p user1@server1" > user2@server2:/<remotePath> <localpath>
> ```
>
> If you use the same user credentials in both servers:
>
> ```bash
> scp -o ProxyCommand="ssh -W %h:%p commonuser@server1" > commonuser@server2:/<remotePath> <localpath>
> ```
