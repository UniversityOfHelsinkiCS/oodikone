import Sentry from '@sentry/node'
import { NextFunction, Response } from 'express'
import { intersection } from 'lodash'

import { configLogoutUrl, isDev, requiredGroup, serviceProvider } from '../config'
import { getMockedUser, getMockedUserFd, getOrganizationAccess, getUserFd, getUserToska } from '../services/userService'
import { OodikoneRequest } from '../types'
import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const parseIamGroups = (iamGroups: string) => iamGroups?.split(';') ?? []

const hasRequiredIamGroup = (iamGroups: string[], iamRights: string[]) => {
  return intersection(iamGroups, requiredGroup).length > 0 || iamRights.length > 0
}

const toskaUserMiddleware = async (req: OodikoneRequest, _res: Response, next: NextFunction) => {
  const {
    'shib-session-id': sessionId,
    'x-show-as-user': showAsUser,
    displayname: name,
    hygroupcn,
    hypersonsisuid: sisId,
    mail: email,
    shib_logout_url: logoutUrl,
    uid: username,
  } = req.headers

  const missingHeaders: string[] = []
  if (!sessionId) missingHeaders.push('shib-session-id')
  if (!username) missingHeaders.push('uid')

  if (missingHeaders.length > 0) {
    throw new ApplicationError(
      `Not enough data in request headers, the following headers were missing: ${missingHeaders.join(', ')}`,
      403,
      { logoutUrl }
    )
  }

  const iamGroups = parseIamGroups(hygroupcn as string)
  const { access = {}, specialGroup = {} } = await getOrganizationAccess(sisId as string, iamGroups)
  const iamRights = Object.keys(access)

  if (!hasRequiredIamGroup(iamGroups, iamRights)) {
    logger.error({
      message: 'User does not have required iam group',
      meta: { username, name, email, iamGroups, iamRights },
    })
    throw new ApplicationError(`User '${username}' does not have required iam group`, 403, { logoutUrl })
  }

  let user

  if (showAsUser && specialGroup?.superAdmin) {
    user = await getMockedUser({ userToMock: showAsUser as string, mockedBy: username as string })
  } else {
    user = await getUserToska({
      username: username as string,
      name: name as string,
      email: email as string,
      iamGroups,
      specialGroup,
      sisId: sisId as string,
      access,
    })
  }

  if (!user) {
    throw new ApplicationError(`Username ${username} not found.`, 403, { logoutUrl })
  }

  Sentry.setUser({ username: user.mockedBy ?? username })

  req.user = user
  req.logoutUrl = logoutUrl as string

  next()
}

const fdUserMiddleware = async (req: OodikoneRequest, _res: Response, next: NextFunction) => {
  const { remote_user: remoteUser, 'x-show-as-user': showAsUser } = req.headers

  if (!remoteUser) {
    throw new ApplicationError('Not enough data in request headers, remote_user was missing', 403, { configLogoutUrl })
  }

  let user

  // getMockedUser in production requires the superAdmin-role, which is only available via iamGroups, so it's now only implemented for the dev environment
  if (showAsUser && isDev) {
    user = await getMockedUserFd({ userToMock: showAsUser as string, mockedBy: remoteUser as string })
  } else {
    user = await getUserFd({ username: remoteUser as string })
  }

  if (!user) {
    throw new ApplicationError(`Could not grant access with the eppn ${remoteUser}.`, 403, { configLogoutUrl })
  }

  req.user = user
  req.logoutUrl = configLogoutUrl

  next()
}

const currentUserMiddleware = serviceProvider === 'Toska' ? toskaUserMiddleware : fdUserMiddleware

export default currentUserMiddleware
