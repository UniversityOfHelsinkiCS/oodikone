# oodikone

[![CircleCI](https://circleci.com/gh/UniversityOfHelsinkiCS/oodikone/tree/master.svg?style=svg)](https://app.circleci.com/pipelines/github/UniversityOfHelsinkiCS/oodikone)

An application for analyzing university data. The entire development environment runs in a Docker network that's defined in the `docker-compose.yml` file. The specifics of what this means for setting up the environment and accessing logs is discussed in a later section.

## Requirements

To run Oodikone locally, you will need the following:

1. [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) running on your system.
2. Membership of [Toska's GitHub organisation](https://github.com/UniversityOfHelsinkiCS).
3. SSH key set up for GitHub (see [docs](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh)).
4. Local clone of this repository.
5. Run the CLI (see [Installation](#Installation))

## Installation

Launch the CLI and follow the instructions:

```bash
npm run cli
```

*Please use a terminal at least 80 characters wide, the CLI is a bit rudimentary* 😊

The acual oodikone can be accessed at [http://localhost:8081/](http://localhost:8081/) and Adminer at [http://localhost:5050/](http://localhost:5050/?pgsql=db&username=postgres).

### Populate Redis on Fresh Install

On a fresh install some features do not work because the redis store is empty. To populate redis, navigate to [http://localhost:8081/updater](http://localhost:8081/updater), and click *Refresh Statistics*.

### What the CLI does

- Builds and runs the Dockerized development environment.
- Downloads a database dump from the production servers.
- Creates the database schema and populates it with the downloaded dump.
- Adds git-hooks to run linting on push. (Use `git push --no-verify` to circumvent this behavior.)

### Daily Refresh

It is recommended to run the "morning script" daily when starting work. It prunes Docker, refreshes the repository and rebuilds the containers before starting Oodikone again.

```bash
./oodikone.sh -m
```

## Development Environment

The development environment is entirely configured in the docker-compose.yml file located in this repository. The file defines the containers/environments for:

- Frontend
- Backend
- Userservice
- The databases used by the services
- Adminer & other dev tools

The mapping of ports and environment variables are also defined in the docker-compose file. You can start, stop and manage the development environment by running the following commands from a terminal shell in this directory.

### Start the development environment

With anonymized data:

```bash
npm start
```

With real data:

```bash
npm run start:real
```

### Stop the development environment

```bash
npm run docker:down
```

### Restart container(s)

All:

```bash
npm run docker:restart
```

Only backend:

```bash
npm run docker:restart:backend
```

Only frontend:

```bash
npm run docker:restart:frontend
```

### View the containers in the running environment

```bash
docker-compose ps
```

### View logs

All:

```bash
npm run docker:logs
```

Only backend:

```bash
npm run docker:logs:backend
```

Only frontend:

```bash
npm run docker:logs:frontend
```

### Attach a terminal shell to a container

```bash
docker exec -it <container> <command>
```

For example:

```bash
docker exec -it backend bash
```

### Use `psql` or other database CLI tools

```bash
docker exec -it -u <username> <container> psql -d <db name>
```

For example:

```bash
docker exec -it -u postgres oodi_db psql -d tkt_oodi
```

## Testing

Testing is implemented as a combination of unit tests (jest) and end-to-end tests (Cypress). Oodikone must be using the anonymous dataset when running tests (see [Installation](#Installation)).

The test suite is run in CI on every push to `trunk`. Take advantage of this as running the tests can take upwards of 15 minutes.

**Note:** All containers must be up and ready before running tests. (Use `npm start`).

### Run All Tests

```bash
npm test
```

### Run End-to-End Tests

```bash
npm run cypress:run
```

## Open Cypress GUI

```bash
npm run cypress:open
```

## Other commands

### Start updater

```bash
npm run docker:updater:dev up
```

### How to `scp` backup files from oodikone via melkki-proxy

This is how the setup script fetches the database dump from production servers. It will require you to have access to both melkki.cs.helsinki.fi as well as oodikone.cs.helsinki.fi. The command uses `scp` to transfer all backup files recursively from a known location on the production server by using the melkki server as a proxy, allowing you to get the dump even if you are not in the university network.

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
