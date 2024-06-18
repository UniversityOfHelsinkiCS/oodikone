const router = require('express').Router()

const { isDev } = require('../conf-backend')
const auth = require('../middleware/auth')
const userService = require('../services/userService')

router.get('/', auth.roles(['admin']), async (_req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', auth.roles(['admin']), async (_req, res) => {
  res.json(userService.roles)
})

router.get('/:uid', auth.roles(['admin']), async (req, res) => {
  try {
    const { uid } = req.params
    const user = await userService.findOne(uid)
    return res.json(user)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
})

router.post('/modifyaccess', auth.roles(['admin']), async (req, res) => {
  const { username, accessgroups } = req.body
  try {
    await userService.modifyAccess(username, accessgroups)
    res.status(204).end()
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post('/:uid/elements', auth.roles(['admin']), async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, true)
  res.status(204).end()
})

router.delete('/:uid/elements', auth.roles(['admin']), async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, false)
  res.status(204).end()
})

router.post('/language', async (req, res) => {
  const {
    body: { language },
    user: { username },
  } = req
  if (!['fi', 'sv', 'en'].includes(language)) {
    return res.status(400).json('invalid language')
  }
  try {
    await userService.updateUser(username, { language })
    return res.status(204).end()
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

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
