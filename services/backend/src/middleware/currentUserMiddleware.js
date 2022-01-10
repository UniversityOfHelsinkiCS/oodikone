const Sentry = require('@sentry/node')
const { ApplicationError } = require('../util/customErrors')
const { getUser, getMockedUser } = require('../services/userService')
const { requiredGroup } = require('../conf-backend')
const _ = require('lodash')

const parseIamGroups = iamGroups => iamGroups?.split(';').filter(Boolean) ?? []

const hasRequiredIamGroup = iamGroups => _.intersection(iamGroups, requiredGroup).length > 0

const currentUserMiddleware = async (req, _res, next) => {
  const { uid: username, 'shib-session-id': sessionId, shib_logout_url: logoutUrl } = req.headers

  if (!sessionId || !username) {
    throw new ApplicationError('Not enough data in request headers', 403, { logoutUrl })
  }

  const { displayname: name, mail: email, hygroupcn, hypersonsisuid: sisId } = req.headers
  const iamGroups = parseIamGroups(hygroupcn)

  req.user = await getUser({
    username,
    name,
    email,
    iamGroups,
    sisId,
  })

  if (!hasRequiredIamGroup(iamGroups)) {
    throw new ApplicationError('User is not enabled', 403, { logoutUrl })
  }

  const showAsUser = req.headers['x-show-as-user']

  if (showAsUser) {
    const mockedUser = await getMockedUser(username, showAsUser)
    if (mockedUser) {
      req.user = mockedUser
    }
  }
  req.logoutUrl = logoutUrl

  const { userId, mockedBy } = req.user

  Sentry.setUser({ username: mockedBy ?? userId })

  next()
}

module.exports = currentUserMiddleware
