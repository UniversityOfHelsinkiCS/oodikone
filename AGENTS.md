# AGENTS.md

Oodikone is a Docker-based Node.js/TypeScript application for analysing University of Helsinki study data. Main areas are:

- `services/frontend`: React, Vite, Redux Toolkit, and Material UI.
- `services/backend`: Express, Sequelize, PostgreSQL, Redis, and BullMQ.
- `services/shared`: shared types and utilities.
- `updater/`: Sisu data workers and scheduler.
- `e2e/`: Playwright e2e tests

Use Node.js 24 or newer. Packages have separate dependencies and lockfiles. Install locally with
`npm run install:local`, or use `npm run ci:local` for lockfile-exact installs. Docker uses host-mounted locks:
update dependencies locally, then run `npm run ci:docker`; do not install in containers.

## Development Rules

- Read nearby code and tests before changing behavior; follow local conventions.
- Keep changes focused and avoid unrelated formatting.
- Reuse `services/shared` for cross-service types and utilities.
- Never commit `.env` files, credentials, database dumps, or real student data.
- Use anonymized data. Do not reset real databases, use destructive commands, or use real-data Docker profiles unless
  explicitly required.
- Treat migrations as production-impacting. They are in `services/backend/src/database/migrations_kone`,
  `services/backend/src/database/migrations_user`, and `updater/sis-updater-worker/src/db/migrations`; test migration
  changes against the relevant database service.
- Do not access the database directly (e.g. `docker exec` into a database container, `psql`, Adminer, or similar).
  Go through the application's models or services instead or ask if there is questions about the data.
- Add tests, especially unit tests, when adding or changing behavior.

## Local Commands

```text
npm run oodikone       # start the anonymized environment
npm run oodikone:ci    # start the test mode
npm run both           # start Oodikone and the updater
npm run docker:down    # stop containers
docker compose ps      # show service status
```

The app runs at `http://localhost:3000` and Adminer at `http://localhost:5050`. Follow logs with
`docker compose logs --follow frontend` or `docker compose logs --follow backend`.

## Style And Verification

- TypeScript/JavaScript: 2 spaces, single quotes, no semicolons, trailing commas where valid, 120-character lines.
- Prefer explicit types at package boundaries, API payloads, Redux state, and database interfaces. Avoid `any` except
  where needed to contain an untyped external API.
- Run `npm run fmt` on changed source, `npm run lint`, and `npm run stylelint` when CSS changes. Do not bypass the
  type-aware Oxlint/Oxfmt pre-commit hooks.
- Run the narrowest relevant check, then broader checks as needed:
  - Frontend: `npm run build --prefix services/frontend`, `npm run test:unit --prefix services/frontend`, or
    `npm run test:component --prefix services/frontend`.
  - Backend: `npm run build --prefix services/backend`, or `npm run test:unit --prefix services/backend`,
    `npm run test:services --prefix services/backend`, or `npm run test:api --prefix services/backend`.
  - Shared: `npm run test --prefix services/shared`.
  - E2E: `npm run playwright -- e2e/<spec>.spec.ts`.
    - If running `docker-compose.ci.yml` add env variable `CI=true` before the e2e npm command.
      Otherwise some tests fail.
- API, service, component, and E2E tests require Docker; start the relevant environment with `npm run oodikone:test`
  or its documented profile. Report any checks that could not run and why.

CI also validates Docker Compose files, Dockerfiles, shell scripts, workflows, and migrations. Keep such changes
minimal and validate them locally where practical.
