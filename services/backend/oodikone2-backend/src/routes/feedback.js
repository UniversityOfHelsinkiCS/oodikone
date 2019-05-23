const router = require('express').Router()
const mailservice = require('../services/mailservice')

router.post('/email', async (req, res) => {
  const { content } = req.body
  const formattedEmail = content.split('\n\n').map(line => `<p> ${line} </p>`).join('')
  const feedback = mailservice.feedback(formattedEmail, req.headers.uid)
  if (process.env.SMTP !== undefined && content) {
    await mailservice.transporter.sendMail(feedback, (error) => {
      if (error) {
        console.log('Error occured')
        res.status(400).json(error).end()
      } else {
        console.log('Message sent succesfully!')
        res.status(200).json('success').end()
      }
      mailservice.transporter.close()
    })
  }
})

module.exports = router