const router = require('express').Router()
const User = require('../services/users')
const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const generateToken = async (uid, res) => {
  const model = await User.byUsername(uid)
  const user = model.dataValues
  if (user.is_enabled) {
    const payload = { userId: uid, name: user.fullname }
    const token = jwt.sign(payload, conf.TOKEN_SECRET, {
      expiresIn: '24h'
    })

    // return the information including token as JSON
    res.status(200).json({
      token: token
    })
  } else {
    res.status(401).end()
  }
}

router.get('/login', async (req, res) => {
  try {
    console.log('login started')
    const uidHeaderName = 'eduPersonPrincipalName'
    const uidHeader = req.headers[uidHeaderName] || req.headers[uidHeaderName.toLowerCase()]
    if (req.headers['shib-session-id'] && uidHeader) {
      console.log('login headers ok')
      const uid = uidHeader.split('@')[0]
      const user = await User.byUsername(uid)
      const fullname = req.headers.givenname || 'Shib Valmis'
      if (!user) {
        console.log('User being created')
        await User.createUser(uid, fullname)
      } else {
        console.log('User exists')
        await User.updateUser(user, { fullname })
      }
      generateToken(uid, res)
    } else {
      console.log('Not enough headers login')
      res.status(401).end()
    }
  } catch (err) {
    console.log('login catch')
    res.status(401).json({ message: 'problem with login' })
  }
})


module.exports = router
