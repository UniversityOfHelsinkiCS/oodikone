const router = require('express').Router()

const { sendFeedbackToToska } = require('../services/mailService')
const logger = require('../util/logger')

router.post('/email', async req => {
  const {
    body: { content },
    user,
  } = req

  await sendFeedbackToToska({
    feedbackContent: content,
    user,
  })

  logger.info(`${user.userId} succesfully sent feedback to toska`)
})

module.exports = router
