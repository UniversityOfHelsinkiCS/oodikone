import { NextFunction, Request, Response } from 'express'

import { Role } from '../types'

export const roles =
  (requiredRoles: Role[], requiredIamGroups?: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const { roles, iamGroups } = req.user
    if (
      requiredRoles.some(role => roles.includes(role)) ||
      requiredIamGroups?.some(group => iamGroups.includes(group)) ||
      roles.includes('admin')
    ) {
      return next()
    }

    res.status(403).json({ error: 'Missing required roles or IAM groups' })
  }
