const router = require('express').Router()
const { ApplicationError } = require('../util/customErrors')

router.get('/login', async (req, res) => {
  const { user, logoutUrl } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    user,
    logoutUrl,
  })
})

module.exports = router
