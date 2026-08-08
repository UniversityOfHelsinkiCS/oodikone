import type { Request, Response, NextFunction } from 'express'

import { runningInCI } from '../config'
import { clockStorage } from '../util/clock'
import logger from '../util/logger'

export function testTimeMiddleware(req: Request, _res: Response, next: NextFunction) {
  const testNow = req.header('x-test-now')

  if (runningInCI && testNow) {
    logger.info(`Setting test time: ${testNow}`)
    return clockStorage.run({ now: new Date(testNow) }, next)
  }

  return clockStorage.run({}, next)
}
