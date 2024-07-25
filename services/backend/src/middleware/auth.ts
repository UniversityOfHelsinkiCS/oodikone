import { NextFunction, Response } from 'express'

import { OodikoneRequest, Role } from '../types'

export const roles = (requiredRoles: Role[]) => async (req: OodikoneRequest, res: Response, next: NextFunction) => {
  if (req.user) {
    const { roles } = req.user
    if (requiredRoles.some(role => roles.includes(role)) || roles.includes('admin')) {
      return next()
    }
  }

  res.status(403).json({ error: 'Missing required roles' })
}
