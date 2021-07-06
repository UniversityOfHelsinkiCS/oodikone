#!/usr/bin/env zx

// Lint github action files
await $`actionlint`

// Lint docker-compose anon setup
await $`docker-compose config -q`

// Lint docker-compose real setup
await $`docker-compose -f docker-compose.yml -f docker-compose.real.yml config -q`

// Lint docker-compose ci setup. Will warn about missing tag, which is okay.
await $`docker-compose -f docker-compose.ci.yml config -q`

// Lint docker-compose test setup
await $`docker-compose -f docker-compose.test.yml config -q`

// Lint dockerfiles
const dockerfiles = [
    "services/backend/oodikone2-backend/Dockerfile", 
    "services/oodikone2-analytics/Dockerfile", 
    "services/oodikone2-frontend/Dockerfile", 
    "services/oodikone2-userservice/Dockerfile"
]
await Promise.all(dockerfiles.map(file => $`hadolint ${file}`))

// Lint shellscripts
const shellscripts = [ "cli.sh", "run.sh"]
await Promise.all(shellscripts.map(file => $`shellcheck -x ${file}`))