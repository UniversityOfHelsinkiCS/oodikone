/* eslint-disable import/no-extraneous-dependencies */
const { parserPlugins } = require('@istanbuljs/schema').defaults.nyc

module.exports = {
  cache: false,
  parserPlugins: parserPlugins.concat('typescript', 'jsx'),
}
