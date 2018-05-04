const router = require('express').Router()
const User = require('../services/users')
const Unit = require('../services/units')

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
  const unit = await Unit.byId(id)
  if (!user || !unit) return res.status(400).end()
  const exists = user.units.find(unit =>  parseInt(id) === unit.dataValues.id)
  if (exists) return res.status(400).end()
  try {
    await User.addUnit(uid, id)
    const user = await User.byId(uid)
    res.status(201).json(user)
  } catch (e) {
    console.log(e)
    res.status(402).json(e)
  }

})

router.delete('/users/:uid/units/:id', async (req, res) => {
  const { uid, id } = req.params
  const user = await User.byId(uid)
  const unit = await Unit.byId(id)
  if (!user || !unit) res.status(400).end()
  else {
    try {
      await User.deleteUnit(uid, id)
      const users = await User.byId(uid)
      res.status(200).json(users)
    } catch (e) {
      console.log('error deleting userunit')
      res.status(402).json(e)
    }
  }
})

module.exports = router