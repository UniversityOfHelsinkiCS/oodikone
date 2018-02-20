module.exports.checkAuth = async (req, res, next) => {
  if (!req.session.user_id) { // if a user is not already logged in
    console.log('no session user id')
    if (!req.headers['shib-session-id']) { //if a user has not just arrived with a valid shibsessionid 
      if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'dev') { //if env isn't test or dev
        console.log('oh no , nothing found and not even in the right environment')
        res.status(401).end()
      }
    }
    req.session.user_id = req.headers['shib-session-id']

    // do some logging in
    next()
  } else {
    console.log('user already logged in')
    next()
  }
}