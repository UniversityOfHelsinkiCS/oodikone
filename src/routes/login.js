const router = require('express').Router()
const User = require('../services/users')
const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const admin = ['totutotu', 'tktl', 'mluukkai', 'mitiai', 'ttuotila', 'jakousa']

const generateToken = async (uid, res) => {
  const model = await User.byUsername(uid)
  const user = model.dataValues
  const payload = {
    userId: uid,
    name: user.full_name,
    enabled: user.is_enabled,
    admin: admin.includes(uid)
  }
  const token = jwt.sign(payload, conf.TOKEN_SECRET, {
    expiresIn: '24h'
  })

  // return the information including token as JSON
  res.status(200).json({
    token: token
  })
}

router.get('/login', async (req, res) => {
  try {
    const uid = req.headers['uid']
    if (req.headers['shib-session-id'] && uid) {
      const user = await User.byUsername(uid)
      const fullname = req.headers.displayname || 'Shib Valmis'
      if (!user) {
        await User.createUser(uid, fullname)
      } else {
        await User.updateUser(user, { full_name: fullname })
      }
      generateToken(uid, res)
    } else {
      res.status(401).json({ message: `Not enough headers login, uid: ${req.headers.uid} session-id ${req.headers['shib-session-id']}` }).end()
    }
  } catch (err) {
    res.status(401).json({ message: 'problem with login', err })
  }
})

router.get('/logout', async (req, res) => {
  try {
    const logoutUrl = req.headers.shib_logout_url
    const { returnUrl } = req.query
    if (logoutUrl) {
      return res.status(200).send({ logoutUrl: `${logoutUrl}?return=${returnUrl}` }).end()
    }
    res.status(200).send({ logoutUrl: returnUrl }).end()
  } catch (err) {
    res.status(500).json({ message: 'Error with logout', err })
  }
})


module.exports = router
