const isProduction = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

const TAG = process.env.TAG || ''

module.exports = {
  isProduction,
  isDev,
  GIT_SHA,
  TAG
}
