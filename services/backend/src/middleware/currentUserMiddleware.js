const Sentry = require('@sentry/node')
const { ApplicationError } = require('../util/customErrors')
const { getUser, getMockedUser } = require('../services/userService')
const { requiredGroup } = require('../conf-backend')
const _ = require('lodash')
const { relevantIAMs } = require('../../config/IAMConfig')
const { getOrganizationAccess } = require('../util/organizationAccess')
const logger = require('../util/logger')

const parseIamGroups = iamGroups => iamGroups?.split(';').filter(Boolean) ?? []

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

  if (!sessionId || !username) {
    throw new ApplicationError('Not enough data in request headers', 403, { logoutUrl })
  }

  const iamGroups = parseIamGroups(hygroupcn).filter(iam => relevantIAMs.includes(iam))

  const iamRights = Object.keys(await getOrganizationAccess({ iamGroups }))

  if (!hasRequiredIamGroup(iamGroups, iamRights)) {
    logger.error({ message: 'User does not have required iam group', meta: { iamGroups, iamRights } })
    throw new ApplicationError('User does not have required iam group', 403, { logoutUrl })
  }

  let user = await getUser({
    username,
    name,
    email,
    iamGroups,
    sisId,
  })

  if (showAsUser && user.isAdmin) {
    user = await getMockedUser({ userToMock: showAsUser, mockedBy: username })
  }

  Sentry.setUser({ username: user.mockedBy ?? username })

  req.user = user
  req.logoutUrl = logoutUrl

  next()
}

module.exports = currentUserMiddleware
