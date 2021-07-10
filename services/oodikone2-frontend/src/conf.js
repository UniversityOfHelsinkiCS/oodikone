const isProduction = process.env.NODE_ENV === 'production'

const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

module.exports = {
  isProduction,
  GIT_SHA
}
