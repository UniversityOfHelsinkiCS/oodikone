import { Request, Router } from 'express'

import { sendFeedbackToToska } from '../services/mailService'
import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const router = Router()

interface EmailRequest extends Request {
  body: {
    content: string
  }
}

router.post('/email', async (req: EmailRequest) => {
  const { content } = req.body
  const { user } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  await sendFeedbackToToska({
    feedbackContent: content,
    user,
  })

  logger.info(`${user.userId} succesfully sent feedback to Toska`)
})

export default router
