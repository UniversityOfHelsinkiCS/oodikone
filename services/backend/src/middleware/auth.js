const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')
const blacklist = require('../services/blacklist')
const { getUserDataFor } = require('../services/userService')
const { ACCESS_TOKEN_HEADER_KEY } = require('../conf-backend')
const { hasRequiredGroup, parseHyGroups } = require('../util/utils')

const TOKEN_VERSION = 1 // When token structure changes, increment in userservice, backend and frontend

const checkAuth = async (req, res, next) => {
  const token = req.headers[ACCESS_TOKEN_HEADER_KEY]
  const uid = req.headers['uid']

  if (!token) {
    return res.status(403).json({ error: 'No token in headers' })
  }

  jwt.verify(token, conf.TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json(err)
    }

    if (decoded.version !== TOKEN_VERSION) {
      return res.status(401).json({ error: 'Token needs to be refreshed - invalid version' })
    }

    if (decoded.mockedBy ? decoded.mockedBy !== uid : decoded.userId !== uid) {
      return res.status(403).json({ error: 'User shibboleth id and token id did not match' })
    }

    const userData = await getUserDataFor(decoded.userId)
    req.decodedToken = decoded
    Object.assign(req, userData)
    next()
  })
}

const roles = requiredRoles => async (req, res, next) => {
  if (req.decodedToken) {
    const { roles } = req

    if (requiredRoles.every(r => roles.indexOf(r) >= 0) || roles.includes('admin')) {
      return next()
    }
  }

  res.status(403).json({ error: 'missing required roles' })
}

const checkRequiredGroup = async (req, res, next) => {
  const hyGroups = parseHyGroups(req.headers['hygroupcn'])
  const enabled = hasRequiredGroup(hyGroups)
  const tokenOutdated = req.decodedToken.enabled !== enabled

  if (tokenOutdated) {
    return res.status(401).json({
      error: 'Token needs to be refreshed - enabled does not match hy-group requirement',
    })
  }

  if (!enabled) {
    return res.status(403).json({ error: 'User is not enabled' })
  }
  next()
}

const checkUserBlacklisting = async (req, res, next) => {
  const { userId, createdAt } = req.decodedToken
  const isBlacklisted = await blacklist.isUserBlacklisted(userId, createdAt)

  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token needs to be refreshed - blacklisted' })
  }

  next()
}

module.exports = {
  checkAuth,
  roles,
  checkRequiredGroup,
  checkUserBlacklisting,
}
