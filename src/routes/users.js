const router = require('express').Router()
const User = require('../services/users')

router.get('/users', async function (req, res) {
  const results = await User.findAll()
  res.json(results)
})

router.post('/users/enable', async function (req, res) {
  const id = req.body.id
  const user = await User.byId(id)
  if (!user) res.status(400).end()
  else {
    const result = await User.updateUser(user, { is_enabled: !user.is_enabled })
    const status = result.error === undefined ? 200 : 400
    res.status(status).json(result)
  }
})
// router.post('/users/unit', async function (req, res) {
//   const id = req.body.id
//   // const unit = req.body.unit
//   const user = await User.byId(id)
//   if(!user) res.status(400).end()
//   else {
//     const units = await User.getUnits(id)
//     console.log(units)


//   }
// })

module.exports = router
