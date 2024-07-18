const router = require('express').Router()

const { isDev } = require('../config')
const auth = require('../middleware/auth')
const userService = require('../services/userService')

router.get('/from-sisu-by-eppn/:newUserEppn', auth.roles(['admin']), async (req, res) => {
  let { username: requesterEppn } = req.user
  const { newUserEppn } = req.params
  // in order to test this feature in the dev environment we need to set an eppn that demo sisu will recognize
  if (isDev && requesterEppn === 'mluukkai') requesterEppn = newUserEppn
  const person = await userService.getUserFromSisuByEppn(requesterEppn, newUserEppn)
  res.json(person)
})

router.post('/add', auth.roles(['admin']), async (req, res) => {
  const { user } = req.body
  const person = await userService.addNewUser(user)
  res.json(person)
})

module.exports = router
