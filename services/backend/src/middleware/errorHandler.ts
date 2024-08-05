import * as Sentry from '@sentry/node'
import { NextFunction, Request, Response } from 'express'

import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const errorHandler = (error: any, _req: Request, res: Response, next: NextFunction) => {
  logger.error(error.message, { error })
  Sentry.captureException(error)

  if (res.headersSent) {
    return next(error)
  }

  const normalizedError = error instanceof ApplicationError ? error : new ApplicationError(error.message)

  return res.status(normalizedError.status).json(normalizedError)
}

export default errorHandler
