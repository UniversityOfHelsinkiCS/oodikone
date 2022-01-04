const router = require('express').Router()
const { ApplicationError } = require('../util/customErrors')

router.get('/login', async (req, res) => {
  const { user: userFromReq, logoutUrl } = req

  if (!userFromReq) {
    throw new ApplicationError('User not found', 404)
  }
  const roles = userFromReq.roles.map(role => role.group_code)
  const user = {
    ...userFromReq,
    roles,
    isAdmin: roles.includes('admin'),
  }

  res.send({
    user,
    logoutUrl,
  })
})
module.exports = router
