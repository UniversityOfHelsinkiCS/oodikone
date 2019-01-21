const router = require('express').Router()
const User = require('../services/users')
const ElementDetails = require('../services/elementdetails')
const userService = require('../services/userService')
const mailservice = require('../services/mailservice')

router.get('/users', async (req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.put('/users/:id/enable', async (req, res) => {
  const id = req.params.id
  const user = await userService.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await userService.updateUser(user.username, { is_enabled: !user.is_enabled })
    const status = result.error === undefined ? 200 : 400
    res.status(status).json(result)
  }
})

router.put('/users/:id/toggleczar', async (req, res) => {
  const id = req.params.id
  const user = await User.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await User.updateUser(user, { czar: !user.czar })
    const status = result.error === undefined ? 200 : 400
    res.status(status).json(result)
  }
})

router.post('/users/modifyaccess', async (req, res) => {
  try {
    const result = await userService.modifyAccess(req.body)
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

router.post('/users/:uid/units/:id', async (req, res) => {
  const { uid, id } = req.params
  const user = await User.byId(uid)
  const elementdetail = await ElementDetails.byId(id)
  if (!user || !elementdetail) return res.status(400).end()
  const exists = user.elementdetails.find(element => element.code === elementdetail.code)
  if (exists) return res.status(400).end()
  try {
    await user.addElementdetails([elementdetail])
    await user.reload()
    res.status(201).json(user)
  } catch (e) {
    console.log(e)
    res.status(402).json(e)
  }
})

router.post('/users/language', async (req, res) => {
  const { username, language } = req.body
  let user = await User.byUsername(username)
  if (!user) return res.status(400).end()
  user.language = language
  try {
    const savedUser = await user.save()
    res.status(201).json(savedUser)
  } catch (e) {
    console.log(e)
    res.status(402).json(e)
  }
})

router.delete('/users/:uid/units/:id', async (req, res) => {
  const { uid, id } = req.params
  const user = await User.byId(uid)
  const elementdetail = await ElementDetails.byId(id)
  if (!user || !elementdetail) res.status(400).end()
  else {
    try {
      await user.removeElementdetails(elementdetail)
      await user.reload()
      res.status(200).json(user)
    } catch (e) {
      console.log('error deleting userunit')
      res.status(402).json(e)
    }
  }
})

router.post('/users/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.enableElementDetails(uid, codes)
  res.json(user)
})

module.exports = router