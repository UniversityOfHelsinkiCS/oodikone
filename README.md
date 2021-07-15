# Oodikone

An application for analyzing university data, running at [https://oodikone.cs.helsinki.fi/](https://oodikone.cs.helsinki.fi/).

## ✔️ Requirements

To run Oodikone locally, you will need the following:

1. Applications:

- [Docker](https://docs.docker.com/install/) (version 20.10+),
- [Docker Compose](https://docs.docker.com/compose/install/)(version 0.29+) and
- [npm](https://docs.npmjs.com/cli/v7) (version 7+)

2. Access to Toska Docker Hub, see Toska Gitlab for more information on how to login
3. (Optional) For real data setup, access to Toskas production servers.

## 🚀 Installation

Launch the CLI and follow the instructions:

```bash
npm run cli
```

_Please use a terminal at least 80 characters wide, the CLI is a bit rudimentary_ 😊

What different CLI options do:

1. Set up oodikone from scratch:

- Cleans up any previous installations
- Installs all needed npm packages locally
- Sets up pre-commit linting hooks.
- Pulls and builds all needed Docker images and sets up dockerized development environment
- **Note:** Running this option cleans up all real data too, so please don't run option 2 before this.

2. Reset all real data:

- Cleans up any previous real data databases
- Downloads needed database dumps from production servers.
- Creates real data databases and populates them with downloaded dumps.

3. Reset sis-importer data

- Like option 2, but only for sis-importer database. Useful when developing updater microservice.

4. Reset old oodi data:

- Like option 2, but for old oodi data, which is not refreshed anymore. Is only needed when setting up real databases after running option 1.

## ⌨️ Development

### Basics

The development environment is entirely configured in the `docker-compose.yml` file located in this repository. The file defines the services for oodikone's two main components: **oodikone** and **updater**.

Running oodikone with real data requires separated databases and redis, which are defined in `docker-compose.real.yml` file. Otherwise real data development environment uses the configuration as anonymized data development environment.

Some useful commands are predefined in `package.json` and can be run with `npm run <command>` as follows:

- `npm run oodikone`: starts oodikone with anonymized data
- `npm run oodikone:real`: starts oodikone with real data
- `npm run updater`: starts updater with anonymized data
- `npm run updater:real`: starts oodikone with real data
- `npm run both`: starts oodikone and updater with anonymized data
- `npm run both:real`: starts oodikone and updater with real data
- `npm run docker:down`: stops the whole environment

If you're first timer, just run `npm run oodikone` after setting up oodikone according to [installation](#installation). After starting and waiting for a while for containers to compile, oodikone can be accessed at [http://localhost:3000/](http://localhost:3000/) and Adminer (database investigation tool) at [http://localhost:5050/](http://localhost:5050/). Adminer requires you to login with username `postgres` and with any password you choose (for example `p`).

### Anon / real data users

Some notes about mluukkai / tkl user here.

### Run.sh script

As said, the development environment runs entirely inside docker containers. To keep `package.json` clean and not filled with predefined scripts, we have created a simple helper script called `./run.sh`. The script allows you to use docker-compose commands without the need to write long list of parameters. Try to run `./run.sh` in the root of the project and see what happens!

`./run.sh` is simply a wrapper script to run oodikone, updater or both services in either anon or real mode. If you take a look at `package.json`, you can see that most of the predefined scripts above use `./run.sh` under the hood.

It is recommended to spend some time to become familiar with `docker` and `docker-compose` cli commands. You can then use them directly or with `./run.sh` wrapper. Here is some examples for day-to-day development situations:

- `./run.sh oodikone anon pull`: Pull all images related to oodikone development
- `./run.sh updater real up --build --force-recreate --detach`: Start updater detached (=in the background) in real data mode, but build new images before starting
- `docker-compose ps`: view the containers in the running environment
- `docker-compose logs frontend`: print logs for just frontend
- `docker-compose logs --follow --tail 100 backend`: print last hundred rows of backend logs and begin to follow them in your terminal window
- `docker exec -it userservice sh`: open bash terminal inside userservice container
- `docker exec -it sis-db psql -U postgres sis-db-real`: open psql client to investigate sis real data database.

### Linting and tests

Linting and other stuff here

The test suite is run in CI on every push to `trunk`. Take advantage of this as running the tests can take upwards of 15 minutes.

### Updater stuff

Stop with HTTP GET

```bash
http://localhost:8082/v1/abort?token=dev
```

Schedule students with HTTP POST

```bash
http://localhost:8082/v1/students?token=dev
```

body

```bash
{
    "studentnumbers": [
        "014598456"
    ]
}
```

## 📖 Documentation

Testing + CI docs link here.

##❓FAQ

### Modules are missing after updating package.json

You should always install the dependencies **inside** the container to have the application **inside** the container access them. This might be the case when someone else installs a new library and you only pull the changes in package.json. Use `docker exec -it <service> sh` to get inside the container and run `npm ci` to install modules.

### Everything is broken, can't get oodikone running, data is not there etc.

Just do clean install by launching cli with `npm cli` and running option 1: _Set up oodikone from scratch_.

## Maintainers and contribution
