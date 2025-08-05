import * as Sentry from '@sentry/node'
import { NextFunction, Request, Response } from 'express'
import { intersection } from 'lodash'

import { configLogoutUrl, isDev, requiredGroup, serviceProvider } from '../config'
import { getMockedUser, getMockedUserFd, getOrganizationAccess, getUserFd, getUserToska } from '../services/userService'
import { FormattedUser, IamAccess } from '../types'
import { ApplicationError } from '../util/customErrors'
import logger from '../util/logger'

const parseIamGroups = (iamGroups: string) => iamGroups?.split(';') ?? []

const hasRequiredIamGroup = (iamGroups: string[], iamRights: string[]) => {
  return intersection(iamGroups, requiredGroup).length > 0 || iamRights.length > 0
}

const getUser = async (
  showAsUser: string | undefined,
  username: string,
  name: string,
  email: string,
  iamGroups: string[],
  specialGroup: Record<string, boolean>,
  sisId: string,
  iamAccess: IamAccess
) => {
  if (showAsUser && specialGroup?.superAdmin) {
    return await getMockedUser({ userToMock: showAsUser, mockedBy: username })
  }
  return await getUserToska({
    username,
    name,
    email,
    iamGroups,
    specialGroup,
    sisId,
    iamAccess,
  })
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

const toskaUserMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
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

  const missingHeaders: string[] = []
  if (!sessionId) missingHeaders.push('shib-session-id')
  if (!username) missingHeaders.push('uid')

  if (missingHeaders.length > 0) {
    const reqUser = username ?? 'Anonymous user'
    throw new ApplicationError(
      `${reqUser} requested ${req.url} without valid request headers. Missing: ${missingHeaders.join(', ')}`,
      403,
      { logoutUrl }
    )
  }

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

  const user = await getUser(showAsUser, username!, name!, email!, iamGroups, specialGroup, sisId!, iamAccess)
  if (!user) {
    throw new ApplicationError(`Username ${username} not found.`, 403, { logoutUrl })
  }

  Sentry.setUser({ username: user.mockedBy ?? username! })

  req.user = user
  req.logoutUrl = logoutUrl!

  next()
}

const fdUserMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const { remote_user: remoteUser, 'x-show-as-user': showAsUser } = req.headers

  if (!remoteUser) {
    throw new ApplicationError('Not enough data in request headers, remote_user was missing', 403, { configLogoutUrl })
  }

  let user: FormattedUser | null

  // getMockedUser in production requires the superAdmin role, which is only available
  // via iamGroups, so it's now only implemented for the dev environment
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

const currentUserMiddleware = serviceProvider === 'toska' ? toskaUserMiddleware : fdUserMiddleware

export default currentUserMiddleware
