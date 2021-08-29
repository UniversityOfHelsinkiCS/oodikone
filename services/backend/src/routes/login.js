const router = require('express').Router()
const userService = require('../services/userService')
const { parseHyGroups } = require('../util/utils')
const { sendNotificationAboutNewUser } = require('../services/mailservice')

router.post('/login', async (req, res) => {
  try {
    const uid = req.headers['uid']
    if (req.headers['shib-session-id'] && uid) {
      const full_name = req.headers.displayname || ''
      const mail = req.headers.mail || ''
      const hyGroups = parseHyGroups(req.headers['hygroupcn'])
      const affiliations = parseHyGroups(req.headers['edupersonaffiliation'])
      const hyPersonSisuId = req.headers.hypersonsisuid || ''

      console.log(uid, 'trying to login, referring to userservice.')
      let { token, isNew } = await userService.login(uid, full_name, hyGroups, affiliations, mail, hyPersonSisuId)
      if (isNew) {
        const result = await sendNotificationAboutNewUser({ userId: uid, userFullName: full_name })
        if (result.error) {
          return res.status(400).json(result).end()
        }
      }
      res.status(200).json({ token })
    } else {
      res
        .status(401)
        .json({
          message: `Not enough headers login, uid: ${req.headers.uid}
        session-id ${req.headers['shib-session-id']}`,
        })
        .end()
    }
  } catch (err) {
    console.log(err)
    res.status(401).json({ message: 'problem with login', err })
  }
})

router.delete('/logout', async (req, res) => {
  try {
    const logoutUrl = req.headers.shib_logout_url
    const { returnUrl } = req.body
    if (logoutUrl) {
      return res
        .status(200)
        .send({ logoutUrl: `${logoutUrl}?return=${returnUrl}` })
        .end()
    }
    res.status(200).send({ logoutUrl: returnUrl }).end()
  } catch (err) {
    res.status(500).json({ message: 'Error with logout', err })
  }
})

module.exports = router
