const express = require('express')
const logger = require('../util/logger')

const wrapWithErrorHandler = fn => (req, res) => Promise.resolve(fn(req, res))
  .catch(error => {
    logger.error(error)
    res.status(500).send('Internal server error')
  })

const routerWithWrapper = () => {
  const router = express.Router()
  return {
    router,
    wrapper: {
      get: (url, callback) => router.get(url, wrapWithErrorHandler(callback)),
      post: (url, callback) => router.post(url, wrapWithErrorHandler(callback))
    }
  }
}

module.exports = { routerWithWrapper }