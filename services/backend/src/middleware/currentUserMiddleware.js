const Sentry = require('@sentry/node')
const { ApplicationError } = require('../util/customErrors')
const { getUser, getUserDataFor, getMockedUser } = require('../services/userService')
const { requiredGroup } = require('../conf-backend')
const _ = require('lodash')

const parseIamGroups = iamGroups => iamGroups?.split(';').filter(Boolean) ?? []

const hasRequiredIamGroup = iamGroups => _.intersection(iamGroups, requiredGroup).length > 0

const currentUserMiddleware = async (req, _, next) => {
  const { uid: username, 'shib-session-id': sessionId, shib_logout_url: logoutUrl } = req.headers

  if (!sessionId) {
    throw new ApplicationError('No session id found in request headers', 403, { logoutUrl })
  }

  if (!username) {
    throw new ApplicationError('No username found in request headers', 403, { logoutUrl })
  }
  const { displayname: name, mail: email, hygroupcn: iamGroups, hypersonsisuid: sisId } = req.headers
  const parsedIamGroups = parseIamGroups(iamGroups)

  req.decodedToken = await getUser({
    username,
    name,
    email,
    iamGroups: parsedIamGroups,
    sisId,
  })

  if (!hasRequiredIamGroup(parsedIamGroups)) {
    throw new ApplicationError('User is not enabled', 403, { logoutUrl })
  }

  const showAsUser = req.headers['x-show-as-user']

  if (showAsUser) {
    const mockedUser = await getMockedUser(username, showAsUser)
    if (mockedUser) {
      req.decodedToken = mockedUser
    }
  }
  req.logoutUrl = logoutUrl

  Sentry.setUser({ username: req.decodedToken.mockedBy || req.decodedToken.userId })

  // TODO: remove this garbo
  const userData = await getUserDataFor(req.decodedToken.userId)
  Object.assign(req, userData)

  next()
}

module.exports = currentUserMiddleware
