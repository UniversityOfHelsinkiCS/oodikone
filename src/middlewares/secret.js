const checkSecret = (req, res, next) => req.headers.secret == process.env.SECRET ? next() : res.status(403)


module.exports = 
  checkSecret
