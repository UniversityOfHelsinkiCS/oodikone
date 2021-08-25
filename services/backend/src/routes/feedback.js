const router = require('express').Router()
const userService = require('../services/userService')
const { sendFeedbackToToska } = require('../services/mailservice')

router.post('/email', async (req, res) => {
  const { content } = req.body
  const { uid } = req.headers
  const { email, full_name } = await userService.byUsername(uid)

  const result = await sendFeedbackToToska({
    feedbackContent: content,
    userId: uid,
    userEmail: email,
    userFullName: full_name,
  })
  if (!result) {
    const errorMessage = 'Error occured when sending email'
    console.log(errorMessage)
    res.status(400).json(errorMessage).end()
  } else {
    console.log('Message sent succesfully!')
    res.status(200).json('success').end()
  }
})

module.exports = router
