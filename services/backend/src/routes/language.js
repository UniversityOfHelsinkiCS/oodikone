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
    const result = await userService.updateUser(userId, { language })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(e.response.status).json(e.response.data)
  }
})

module.exports = router
