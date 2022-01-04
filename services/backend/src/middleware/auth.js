const roles = requiredRoles => async (req, res, next) => {
  if (req.user) {
    const { roles } = req

    if (requiredRoles.every(r => roles.indexOf(r) >= 0) || roles.includes('admin')) {
      return next()
    }
  }

  res.status(403).json({ error: 'missing required roles' })
}

module.exports = {
  roles,
}
