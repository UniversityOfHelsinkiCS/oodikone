const router = require('express').Router()
const userService = require('../services/userService')

router.post('/language', async (req, res) => {
  const {
    body: { language },
    user: { userId },
  } = req
  if (!['fi', 'sv', 'en'].includes(language)) {
    return res.status(400).json('invalid language')
  }
  try {
    await userService.updateUser(userId, { language })
    return res.status(204).end()
  } catch (e) {
    return res.status(e.response.status).json(e.response.data)
  }
})

module.exports = router
