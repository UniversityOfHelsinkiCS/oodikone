const router = require('express').Router()
const User = require('../services/users')
const ElementDetails = require('../services/elementdetails')

router.get('/users', async (req, res) => {
  const results = await User.findAll()
  res.json(results)
})

router.put('/users/:id/enable', async (req, res) => {
  const id = req.params.id
  const user = await User.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await User.updateUser(user, { is_enabled: !user.is_enabled })
    const status = result.error === undefined ? 200 : 400
    res.status(status).json(result)
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

module.exports = router