import { NextFunction, Request, Response } from 'express'

import { Role } from '../types'

export const roles = (requiredRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const { roles } = req.user
  if (requiredRoles.some(role => roles.includes(role)) || roles.includes('admin')) {
    return next()
  }

  res.status(403).json({ error: 'Missing required roles' })
}
