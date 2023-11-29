const roles = requiredRoles => async (req, res, next) => {
  if (req.user) {
    const {
      user: { roles },
    } = req

    if (requiredRoles.some(r => roles.includes(r)) || roles.includes('admin')) {
      return next()
    }
  }

  res.status(403).json({ error: 'missing required roles' })
}

module.exports = {
  roles,
}
