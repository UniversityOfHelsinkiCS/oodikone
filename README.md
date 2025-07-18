# Oodikone
[![Maintainability](https://qlty.sh/gh/UniversityOfHelsinkiCS/projects/oodikone/maintainability.svg)](https://qlty.sh/gh/UniversityOfHelsinkiCS/projects/oodikone)

An application for analyzing university data, running at [https://oodikone.helsinki.fi/](https://oodikone.helsinki.fi/).

## ✔️ Requirements

To run Oodikone locally, you will need the following:

1. Applications
   - [Docker](https://docs.docker.com/install/) (version `20.10+`),
   - [Docker Compose](https://docs.docker.com/compose/install/) (version `1.29+`)
   - [npm](https://docs.npmjs.com/cli/v7) (version `7+`)
2. Access to Toska Docker Hub
3. For real data setup, access to Toska's production servers
4. For some features to work, access to Toska's service tokens

## 🚀 Installation

Pre-installation steps:

- Clone this repo
  - `git@github.com:UniversityOfHelsinkiCS/oodikone.git`
- Login to Toska's Docker Hub (see Toska's GitLab for more information)
- Copy the `.env.template` file to `.env` and populate with correct tokens
  - `cp .env.template .env`

Then launch the CLI and follow the instructions:

```bash
npm run cli
```

_Please use a terminal at least 80 characters wide, the CLI is a bit rudimentary_ 😊

What different CLI options do:

1. Set up Oodikone from scratch
   - Cleans up any previous installations
   - Installs all needed npm packages locally
   - Sets up pre-commit linting hooks
   - Pulls and builds all needed Docker images and sets up dockerized development environment
   - Setup happens with anonymized data, which developers should use by default
   - **Note:** Running this option cleans up all real data too, so please don' run option 2 before this.
2. Reset all real data
   - Cleans up any previous real data databases
   - Downloads needed database dumps from production servers.
   - Creates real data databases and populates them with downloaded dumps.
3. Reset a single database
   - Like option 2, but only for single database
   - Leaves other databases untouched
4. Restore data from dumps
   - Like option 2, but skips downloading, and simply restores databases from the dumps downloaded earlier
5. Docker system prune
   - Runs `docker system prune -a && docker volume prune -a`
   - This will remove all your Docker data, also related to any other applications than Oodikone!
   - Sometimes necessary after strange errors due to caching

## ⌨️ Development

### Architecture

```mermaid
graph TB
    subgraph Oodikone & Updater
        subgraph Oodikone
            client[React app] --> server[NodeJS server]
            server --> ok_redis(Redis)
            konedb[(kone-db)]
            userdb[(user-db)]
        end
        server -->|Read| sisdb[(sis-db)]
        subgraph Updater
            updaterscheduler[Scheduler] --> |Push BullMQ jobs| redis(Redis)
            updaterworker[Worker] -->|Write| sisdb
            updaterworker --> |Fetch BullMQ jobs| redis
        end
    end

    subgraph Common Toska services
        jami[JAMI]
        pate[Pate]
        importer[Importer]
    end

    updaterworker -->|Read db| importer
    updaterscheduler -->|Read db| importer
    importer -->|Fetch data| sisu[Sisu export APIs]
    server -->|Get IAM access| jami
    server -->|Send mail| pate

    subgraph Analytics
        direction TB
        sentry[Sentry]
        graylog[Graylog]
        grafana[Grafana]
    end
```

In development, backend and updater use the same Redis, but in production they are separate.

See also the [older graph](documentation/img/oodikone.png) for more information.

To read a bit more details about what updater-scheduler and updater-worker do, see their own READMEs:

- [updater-scheduler's README](./updater/sis-updater-scheduler/README.md)
- [updater-worker's README](./updater/sis-updater-worker/README.md)

### Documentation

The `documentation` directory contains some notes on the sis-db schema and is meant as a place for storing useful information on Oodikone to make life easier for future developers. Feel free to add anything relevant!

For internal meeting notes and sensitive information, see Toska GitLab.

[SortableTable documentation](./services/frontend/src/components/SortableTable/README.md)

### Basics

The development environment is entirely configured in the `docker-compose.yml` file located in this repository. The file defines the services for Oodikone's two main components: **oodikone** and **updater**.

Running Oodikone with real data requires separated databases and redis, which are defined in `docker-compose.real.yml` file. Otherwise real data development environment uses the configuration as anonymized data development environment.

Some useful commands are defined in `package.json` and can be run with `npm run <command>` as follows:

- `npm run oodikone`: starts Oodikone with anonymized data
- `npm run oodikone:real`: starts Oodikone with real data
- `npm run updater`: starts updater with anonymized data
- `npm run updater:real`: starts updater with real data
- `npm run both`: starts Oodikone and updater with anonymized data
- `npm run both:real`: starts Oodikone and updater with real data
- `npm run docker:down`: stops the whole environment
- `npm run testupdater`: runs tests for updater
- `npm run flushredis`: clears Redis, which forces big calculations to be redone in e.g. studyprogramme overview and faculty views
- `npm run rapodiff`: runs [Rapodiff](./services/backend/src/rapodiff/)
- `npm run install:local`: installs `node_modules` for each package (backend, frontend, sis-updater-scheduler and sis-updater-worker) locally
- `npm run install:docker`: installs `node_modules` for each package inside containers
- `npm run install:both`: runs both `npm run install:local` and `npm run install:docker`

Once you have ran setup for Oodikone , you can just execute the first one (`npm run oodikone`). After starting and waiting for a while for containers to compile, Oodikone can be accessed at [http://localhost:3000](http://localhost:3000/) and Adminer (database investigation tool) at [http://localhost:5050](http://localhost:5050/). Adminer requires you to login with username `postgres` and with any password you choose (for example `p`).

### Run.sh script

As said, the development environment runs entirely inside Docker containers. To keep `package.json` clean and not filled with predefined scripts, we have created a simple helper script called `./run.sh`. The script allows you to use docker-compose commands without the need to write long list of parameters. Try to run `./run.sh` in the root of the project and see what happens!

`./run.sh` is simply a wrapper script to run Oodikone, updater or both services in either anon or real mode. If you take a look at `package.json`, you can see that most of the predefined scripts above use `./run.sh` under the hood.

It is recommended to spend some time to become familiar with `docker` and `docker compose` cli commands. You can then use them directly or with `./run.sh` wrapper. Here is some examples for day-to-day development situations:

- `./run.sh oodikone anon pull`: pull all images related to Oodikone development
- `./run.sh updater real up --build --force-recreate --detach`: start updater detached (in the background) in real data mode, but build new images before starting
- `docker compose ps`: view the containers in the running environment
- `docker compose logs frontend`: print logs for just frontend
- `docker compose logs --follow --tail 100 backend`: print last hundred rows of backend logs and begin to follow them in your terminal window
- `docker exec -it backend sh`: open bash terminal inside backend container
- `docker exec -it sis-db psql -U postgres sis-db-real`: open psql client to investigate sis real data database

### User types for development

By default, you're login as `mluukkai` dev user when running Oodikone in development mode. If you want to debug with certain type of user, you can use mocking: go to the "Users" page, click "edit" on the user you want to use and then click the icon on the right corner of user card. Another way is to mock user headers - see frontend's API configuration for how this is done.

Anonymous data contains some preset user types, corresponding to most usual user types in real data. These are used in testing too (see "Testing" below for more info).

### Linting

Cli script sets up pre-commit hooks that are used to lint and fix files before committing. If your `package.json` file doesn't include "lint-staged" -key, please set hooks manually with `npm run prepare`.

For more information on how files are tested, take a look at "lint-staged" in `package.json`. Some files (e.g. github action files, dockerfiles, shell scripts) are checked with external tools and may require you to install those tools in case you're modifying files in question.

Pre-commit hooks will fix auto-fixable problems. To set up quick formatting: In VSCode you can go to command palette, select "ESLint: Fix all auto-fixable problems" and assign a hotkey for it, like `SHIFT + CTRL + '.'`.

## 🔨 Testing & CI

We use cypress for end-to-end testing. No unit tests are currently used.

Cypress

- Can be launched in interactive mode with `npm run cypress open`. `package.json` defines entrypoint `npm run cypress` so you can basically run cypress with any arguments you want
- Are defined in cypress -folder and cypress.config.json
- The entire cypress test stack takes about 15 to 20 mins to run. Since tests are ran in our Github actions CI pipe, you're encouraged to take advantage of this instead of running all tests locally.
- Running tests locally sometimes causes problems after running the whole tests suite due to some login-related issue. Also for this reason, it is usually best practice to only run single views locally, and let the CI run the entire test suite.
- There are some different user types and cypress commands defined for testing. Take a look at these when debugging tests.

Continuous integration (CI) works with Github actions and is defined in workflow files in `.github/workflows` folder:

- Oodikone setup for cypress and other tests in CI is defined in `docker-compose.ci.yml`. Take a look at this too if debugging github action workflows.
- Tests are run on every push
- After a successful test run, Oodikone is deployed to staging
- After creating a release, Oodikone is deployed to production
- Updater is deployed to production when pushed if tests pass
- Test databases can be updated, instructions in [anonyymioodi README](anonyymioodi/README.md)

[Rapodiff](./services/backend/src/rapodiff/) can be used to check differences between Rapo and Oodikone data.

## ❓FAQ

### Modules are missing after updating package.json

You should always install the dependencies **inside** the container to have the application **inside** the container access them. Module might be missing for example when someone else installs a new library and you only pull the changes in package.json. Use `docker exec <service> npm ci` to install modules inside the container or `npm run install:docker` to install modules inside all packages (backend, frontend, sis-updater-scheduler and sis-updater-worker).

### Study guidance groups don't work on my machine

Make sure you have your VPN on.

### Everything is broken, can't get oodikone running, data is not there etc.

First: Try `npm run cli` option 1: _Set up oodikone from scratch_ and then option 2 to download and restore databases (or option 4 to skip downloading, if you've done it recently).

If that does not help, try option 5: _Docker system prune_. Notice that this clears up **all Docker data**, including data related to other projects. If this is not ok, you'll need to identify the Oodikone-specific Docker volumes yourself and caches and clear those invididually.

### How to run tests locally faster

Vite simplifies development but can be **very slow** when running tests. If you're curious about the reasons for this, you can read more in [this GitHub issue](https://github.com/cypress-io/cypress/issues/22968).

To speed up testing, you can use Vite's preview mode. This will make the tests run faster, but keep in mind that you must rebuild the frontend code every time you make changes to it. To use the preview mode, follow these steps:

1. Run `npm run build` in the `services/frontend` directory.
2. Run `npm run preview` in the `services/frontend` directory and keep it running.
3. Update the `baseUrl` in [cypress.config.js](./cypress.config.js) to `http://localhost:4173`.
4. Start Oodikone with `npm run oodikone`.

After these steps, you can run your tests:

- Use `npm run cypress open` to open the Cypress UI and run the tests interactively.

Tests can also be run in headless mode, similar to how they are run in the CI/CD pipeline. To do this, use:

```bash
npm run cypress:run -- --spec <file path>
```

For example:

```bash
npm run cypress:run -- --spec "cypress/e2e/Language_center.js"
```

Running tests in headless mode may also help if your browser keeps crashing when running tests interactively. If you want to run all tests, use:

```bash
npm run cypress:run
```

Remember to revert the `baseUrl` in [cypress.config.js](./cypress.config.js) to its original value when you're done.

## ✌🏼 Maintainers and contribution

[Toska](https://toska.dev) - University of Helsinki

## 🛡️ Tietosuoja / data protection

See [tietosuoja.md](./documentation/tietosuoja.md).
