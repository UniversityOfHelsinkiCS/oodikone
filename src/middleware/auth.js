module.exports.checkAuth = async (req, res, next) => {
  console.log('Heree')
  if (!req.session.user_idc) { // if a user is not already logged in
    console.log('no session user id')
    if (!req.headers['shib-session-id']) { //if a user has not just arrived with a valid shibsessionid 
      console.log('sno shib-session-id')
      if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'dev') { //if env isn't test or dev
        console.log('oh no , nothing found and not even in the right environment')
        res.status(401).end()
      }
    }
    
    // log user in if shibboleth session id exists
    req.session.shib_session_id = req.headers['shib-session-id']
    console.log('Shib-sessin-id Success: ', req.headers['shib-session-id'])
  } else {
    next()
  }
}