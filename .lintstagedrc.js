const path = require('path')
const cwd = process.cwd()
const dockerCmdBase = `docker run --rm --volume ${cwd}:/oodikone --workdir /oodikone`
const relativeFilePaths = files => [...files.map(file => path.relative(cwd, file))].join(' ')

module.exports = {
  '{services,updater}/**/*.{js,jsx}': files => `eslint --fix ${files.join(' ')} --report-unused-disable-directives`,
  '*.{js,json,md,yml,yaml,html}': files => `prettier --write ${files.join(' ')}`,
  '*.css': files => `stylelint --fix ${files.join(' ')}`,
  Dockerfile: files =>
    `${dockerCmdBase} hadolint/hadolint:v2.12.0 hadolint --ignore DL3006 ${relativeFilePaths(files)}`,
  '*.sh': files => `${dockerCmdBase} koalaman/shellcheck:v0.7.2 ${relativeFilePaths(files)} -x`,
  '.github/{workflows,actions}/*': files => `npm run actionlint ${relativeFilePaths(files)}`,
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

    return files.map(file => `docker-compose ${composeFiles(file)} config --quiet`)
  },
}
