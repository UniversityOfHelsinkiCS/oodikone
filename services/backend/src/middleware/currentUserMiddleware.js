const Sentry = require('@sentry/node')
const _ = require('lodash')

const { requiredGroup } = require('../conf-backend')
const { getUser, getMockedUser, getOrganizationAccess } = require('../services/userService')
const { ApplicationError } = require('../util/customErrors')
const logger = require('../util/logger')

const parseIamGroups = iamGroups => iamGroups?.split(';') ?? []

const hasRequiredIamGroup = (iamGroups, iamRights) =>
  _.intersection(iamGroups, requiredGroup).length > 0 || iamRights.length > 0

const currentUserMiddleware = async (req, _res, next) => {
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
    logger.error({ message: 'User does not have required iam group', meta: { iamGroups, iamRights } })
    throw new ApplicationError(`User '${username}' does not have required iam group`, 403, { logoutUrl })
  }

  let user

  if (showAsUser && specialGroup?.superAdmin) {
    user = await getMockedUser({ userToMock: showAsUser, mockedBy: username })
  } else {
    user = await getUser({ username, name, email, iamGroups, specialGroup, sisId, access })
  }

  Sentry.setUser({ username: user.mockedBy ?? username })

  req.user = user
  req.logoutUrl = logoutUrl

  next()
}

module.exports = currentUserMiddleware
