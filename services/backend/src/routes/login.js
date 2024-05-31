const router = require('express').Router()
const _ = require('lodash')

const { ApplicationError } = require('../util/customErrors')

router.get('/', async (req, res) => {
  const { user, logoutUrl } = req

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
