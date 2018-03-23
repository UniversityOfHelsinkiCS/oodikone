const cssNextPlugin = require('postcss-cssnext') // eslint-disable-line import/no-extraneous-dependencies

const variables = require('./src/styles/variables')

module.exports = {
  plugins: [
    cssNextPlugin({
      browsers: 'last 2 versions',
      features: {
        customProperties: { variables }
      }
    })
  ]
}
