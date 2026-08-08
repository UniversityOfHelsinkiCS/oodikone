import type { Request, Response, NextFunction } from 'express'

import { isTest } from '../config'
import { clockStorage } from '../util/clock'

export function testTimeMiddleware(req: Request, res: Response, next: NextFunction) {
  const testNow = req.header('x-test-now')

  if (isTest && testNow) {
    return clockStorage.run({ now: new Date(testNow) }, next)
  }

  return clockStorage.run({}, next)
}
