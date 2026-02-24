import * as Sentry from '@sentry/node'
import { NextFunction, Request, Response } from 'express'
import { intersection } from 'lodash-es'

import { requiredGroup } from '../config'
import { getMockedUser, getOrganizationAccess, getUser } from '../services/userService'
import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const parseIamGroups = (iamGroups: string) => iamGroups?.split(';') ?? []

const hasRequiredIamGroup = (iamGroups: string[], iamRights: string[]) => {
  return intersection(iamGroups, requiredGroup).length > 0 || iamRights.length > 0
}

type Headers = {
  displayname?: string
  hygroupcn?: string
  hypersonsisuid?: string
  mail?: string
  'shib-session-id'?: string
  shib_logout_url?: string
  uid?: string
  'x-show-as-user'?: string
}

export default async (req: Request, _: Response, next: NextFunction) => {
  const {
    'shib-session-id': sessionId,
    'x-show-as-user': showAsUser,
    displayname: name,
    hygroupcn,
    hypersonsisuid: sisId,
    mail: email,
    shib_logout_url: logoutUrl,
    uid: username,
  } = req.headers as Headers

  if (!username || !sessionId)
    throw new ApplicationError(
      `${username ?? 'Anonymous user'} requested ${req.url} without authorization headers.`,
      403,
      { logoutUrl }
    )

  const iamGroups = parseIamGroups(hygroupcn!)

  const { iamAccess = {}, specialGroup = {} } = await getOrganizationAccess(sisId!, iamGroups)
  const iamRights = Object.keys(iamAccess)

  if (!hasRequiredIamGroup(iamGroups, iamRights)) {
    logger.error({
      message: 'User does not have required iam group',
      meta: { username, name, email, iamGroups, iamRights },
    })

    throw new ApplicationError(`User '${username}' does not have required iam group`, 403, { logoutUrl })
  }

  const user =
    showAsUser && specialGroup?.superAdmin
      ? await getMockedUser({ userToMock: showAsUser, mockedBy: username })
      : await getUser({
          username,
          name: name!,
          email: email!,
          iamGroups,
          specialGroup,
          sisId: sisId!,
          iamAccess,
        })

  // Set username just-in-case there is error for invalid user
  Sentry.setUser({ username: user?.mockedBy ?? username })
  if (!user) throw new ApplicationError(`Username ${username} not found.`, 403, { logoutUrl })

  req.user = user
  req.logoutUrl = logoutUrl!

  next()
}
