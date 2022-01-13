const Sentry = require('@sentry/node')
const { ApplicationError } = require('../util/customErrors')
const { getUser, getMockedUser } = require('../services/userService')
const { requiredGroup } = require('../conf-backend')
const _ = require('lodash')

const parseIamGroups = iamGroups => iamGroups?.split(';').filter(Boolean) ?? []

const hasRequiredIamGroup = iamGroups => _.intersection(iamGroups, requiredGroup).length > 0

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

  const iamGroups = parseIamGroups(hygroupcn)

  if (!hasRequiredIamGroup(iamGroups)) {
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
