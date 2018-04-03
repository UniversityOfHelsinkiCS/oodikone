const router = require('express').Router()
const User = require('../services/users')
const Unit = require('../services/units')

router.get('/users', async (req, res) => {
  const results = await User.findAll()
  res.json(results)
})

router.post('/users/enable', async (req, res) => {
  const id = req.body.id
  const user = await User.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await User.updateUser(user, { is_enabled: !user.is_enabled })
    const status = result.error === undefined ? 200 : 400
    res.status(status).json(result)
  }
})

router.post('/users/unit', async (req, res) => {
  const user = await User.byUsername(req.body.id)
  const unit = await Unit.byId(req.body.unit)
  if(!user) res.status(400).end()
  else {
    console.log(unit)
    console.log(user)
    // Add into liitostaulu where unit & user
    // Sequelize probably has easy way to insert into joining table
    res.status(404).end()
  }
})

router.delete('/users/unit', async (req, res) => {
  const user = await User.byUsername(req.body.id)
  const unit = await Unit.byId(req.body.unit)
  if(!user) res.status(400).end()
  else {
    console.log(unit)
    console.log(user)
    // Remove from liitostaulu where unit & user
    // Sequelize probably has easy way to delete from joining table
    res.status(404).end()
  }
})

module.exports = router
