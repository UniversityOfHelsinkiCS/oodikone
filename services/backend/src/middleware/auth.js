const { getUserDataFor, getLoginDataWithoutToken } = require('../services/userService')
const { hasRequiredGroup, parseHyGroups } = require('../util/utils')

const checkAuth = async (req, res, next) => {
  const uid = req.headers['uid']
  if (req.headers['shib-session-id'] && uid) {
    const full_name = req.headers.displayname || ''
    const mail = req.headers.mail || ''
    const hyGroups = parseHyGroups(req.headers['hygroupcn'])
    const affiliations = parseHyGroups(req.headers['edupersonaffiliation'])
    const hyPersonSisuId = req.headers.hypersonsisuid || ''
    const { payload: decoded } = await getLoginDataWithoutToken(
      uid,
      full_name,
      hyGroups,
      affiliations,
      mail,
      hyPersonSisuId
    )
    const userData = await getUserDataFor(decoded.userId)
    req.decodedToken = decoded
    Object.assign(req, userData)
    next()
  } else {
    return res
      .status(401)
      .json({
        message: `Not enough headers to login, uid: ${req.headers.uid}
        session-id ${req.headers['shib-session-id']}`,
      })
      .end()
  }
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

module.exports = {
  checkAuth,
  roles,
  checkRequiredGroup,
}
