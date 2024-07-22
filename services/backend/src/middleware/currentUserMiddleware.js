const Sentry = require('@sentry/node')
const { intersection } = require('lodash')

const { requiredGroup, serviceProvider, configLogoutUrl, isDev } = require('../config')
const { getUser, getMockedUser, getOrganizationAccess } = require('../services/userService')
const { ApplicationError } = require('../util/customErrors')
const logger = require('../util/logger')

const parseIamGroups = iamGroups => iamGroups?.split(';') ?? []

const hasRequiredIamGroup = (iamGroups, iamRights) => {
  return intersection(iamGroups, requiredGroup).length > 0 || iamRights.length > 0
}

const toskaUserMiddleware = async (req, _res, next) => {
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

  const missingHeaders = []

  if (!sessionId) missingHeaders.push('shib-session-id')
  if (!username) missingHeaders.push('uid')

  if (missingHeaders.length > 0) {
    throw new ApplicationError(
      `Not enough data in request headers, the following headers were missing: ${missingHeaders.join(', ')}`,
      403,
      { logoutUrl }
    )
  }

  const iamGroups = parseIamGroups(hygroupcn)
  const { access = {}, specialGroup = {} } = await getOrganizationAccess(sisId, iamGroups)
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
    user = await getMockedUser({ userToMock: showAsUser, mockedBy: username })
  } else {
    user = await getUser({ username, name, email, iamGroups, specialGroup, sisId, access })
  }

  if (!user) {
    throw new ApplicationError(`Username ${username} not found.`, 403, { logoutUrl })
  }

  Sentry.setUser({ username: user.mockedBy ?? username })

  req.user = user
  req.logoutUrl = logoutUrl

  next()
}

const fdUserMiddleware = async (req, _res, next) => {
  const { remote_user: remoteUser, 'x-show-as-user': showAsUser } = req.headers

  if (!remoteUser) {
    throw new ApplicationError('Not enough data in request headers, remote_user was missing', 403, { configLogoutUrl })
  }

  let user

  // getMockedUser in production requires the superAdmin-role, which is only available via iamGroups, so it's now only implemented for the dev environment
  if (showAsUser && isDev) {
    user = await getMockedUser({ userToMock: showAsUser, mockedBy: remoteUser })
  } else {
    user = await getUser({ username: remoteUser })
  }

  if (!user) {
    throw new ApplicationError(`Could not grant access with the eppn ${remoteUser}.`, 403, { configLogoutUrl })
  }

  req.user = user
  req.logoutUrl = configLogoutUrl

  next()
}

const currentUserMiddleware = serviceProvider === 'Toska' ? toskaUserMiddleware : fdUserMiddleware

module.exports = currentUserMiddleware
