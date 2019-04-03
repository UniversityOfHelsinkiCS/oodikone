const { SECRET } = require('../conf-usageservice')

const checkSecret = (req, res, next) => req.headers.secret == SECRET ? next() : res.status(403)

module.exports = checkSecret
