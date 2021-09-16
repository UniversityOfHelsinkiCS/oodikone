const router = require('express').Router()
const userService = require('../services/userService')
const { sendFeedbackToToska } = require('../services/mailservice')
const logger = require('../util/logger')

router.post('/email', async (req, res) => {
  const { content } = req.body
  const {
    decodedToken: { userId },
  } = req
  const { email, full_name } = await userService.byUsername(userId)

  const result = await sendFeedbackToToska({
    feedbackContent: content,
    userId,
    userEmail: email,
    userFullName: full_name,
  })
  if (result.error) {
    return res.status(400).json(result).end()
  }
  logger.info(`${userId} succesfully sent some feedback mail to toska`)

  res.status(200).json('success').end()
})

module.exports = router
