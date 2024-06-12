const router = require('express').Router()
const _ = require('lodash')

const { ApplicationError } = require('../util/customErrors')
const { initializeDatabaseConnection } = require('../database/connection')
const { initModels } = require('../models/init-models')

router.get('/', async (req, res) => {
  const { user, logoutUrl } = req
  console.log({ initModels })
  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    // don't send possibly huge list of students to frontend
    user: _.omit(user, ['studentsUserCanAccess']),
    logoutUrl,
  })
})

module.exports = router
