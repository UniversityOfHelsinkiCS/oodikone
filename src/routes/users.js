const router = require('express').Router()
const userService = require('../services/userService')
const mailservice = require('../services/mailservice')
const blacklist = require('../services/blacklist')
const { ACCESS_TOKEN_HEADER_KEY } = require('../conf-backend')

const blacklistRequestToken = async (req) => {
  const token = req.headers[ACCESS_TOKEN_HEADER_KEY]
  await blacklist.addTokenToBlacklist(token)
}

router.get('/', async (req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', async (req, res) => {
  const result = await userService.getAccessGroups()
  res.json(result)
})

router.put('/:id/enable', async (req, res) => {
  const id = req.params.id
  const user = await userService.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await userService.updateUser(user.username, { is_enabled: !user.is_enabled })
    const status = result.error === undefined ? 200 : 400
    await blacklistRequestToken(req)
    res.status(status).json(result)
  }
})

router.post('/modifyaccess', async (req, res) => {
  try {
    const result = await userService.modifyAccess(req.body)
    await blacklistRequestToken(req)
    res.status(200).json(result)
  } catch (e) {
    res.status(400).json(e)
  }
})

router.post('/email', async (req, res) => {
  const email = req.body.email
  if (process.env.SMTP !== undefined && email) {
    const message = mailservice.message2(email)
    await mailservice.transporter.sendMail(message, (error) => {
      if (error) {
        console.log('Error occurred')
        res.status(400).end()
      } else {
        console.log('Message sent successfully!')
        res.status(200).end()
      }
      mailservice.transporter.close()
    })
  }
})

router.post('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.enableElementDetails(uid, codes)
  await blacklistRequestToken(req)
  res.json(user)
})

module.exports = router