import { Request, Response, Router } from 'express'

import { sendFeedback } from '../services/mailService'
import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const router = Router()

interface EmailRequest extends Request {
  body: {
    content: string
  }
}

router.post('/email', async (req: EmailRequest, res: Response) => {
  const { content } = req.body
  const { user } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  await sendFeedback({
    feedbackContent: content,
    user,
  })

  logger.info(`${user.userId} succesfully sent feedback to Toska`)
  return res.status(200).end()
})

export default router
