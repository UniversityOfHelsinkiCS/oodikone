const router = require('express').Router()
const { ApplicationError } = require('../util/customErrors')

router.get('/login', async (req, res) => {
  const { decodedToken, logoutUrl } = req

  if (!decodedToken) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    token: decodedToken,
    logoutUrl,
  })
})
module.exports = router
