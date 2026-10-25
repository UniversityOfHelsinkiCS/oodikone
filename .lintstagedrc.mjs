import { relative } from 'path'

const cwd = process.cwd()
const dockerCmdBase = `docker run --rm --volume ${cwd}:/oodikone --workdir /oodikone`
const relativeFilePaths = files => [...files.map(file => relative(cwd, file))].join(' ')

export default {
  // INFO: oxlint --type-check is equivalent to running tsc --noEmit
  '{services,updater}/**/*.{js,jsx,ts,tsx}': files =>
    `oxlint --fix --type-aware --type-check --no-error-on-unmatched-pattern --quiet ${files.join(' ')}`,

  '*.{js,jsx,ts,tsx,json,md,yml,yaml,html,css}': files => `oxfmt --no-error-on-unmatched-pattern ${files.join(' ')} `,

  '*.css': files => `stylelint --fix ${files.join(' ')}`,

  Dockerfile: files =>
    // DL3018: "Pin versions in apk add" skipped as the only apk add is curl which should always be the
    // newest possible version for security reasons.
    `${dockerCmdBase} hadolint/hadolint:v2.15.1 hadolint --ignore DL3018 ${relativeFilePaths(files)}`,
  '*.sh': files => `${dockerCmdBase} koalaman/shellcheck:v0.11.0 ${relativeFilePaths(files)} -x`,
  'docker-compose*': files => {
    const composeFiles = file => {
      if (['docker-compose.ci.yml', 'docker-compose.test.yml'].some(f => file.includes(f))) {
        return `--file ${file}`
      }
      if (file.includes('docker-compose.real.yml')) {
        return `--file ${cwd}/docker-compose.yml --file ${file}`
      }
      return ''
    }

    return files.map(file => `docker compose ${composeFiles(file)} config --quiet`)
  },
}
