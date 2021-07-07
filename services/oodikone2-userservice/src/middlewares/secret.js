const { SECRET } = require('../conf')

const checkSecret = (req, res, next) => (req.headers.secret == SECRET ? next() : res.status(403).end())

module.exports = checkSecret
