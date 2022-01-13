const router = require('express').Router()
const { ApplicationError } = require('../util/customErrors')
const _ = require('lodash')

router.get('/login', async (req, res) => {
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
