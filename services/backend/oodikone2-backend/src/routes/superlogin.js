const router = require('express').Router()
const userService = require('../services/userService')

router.post('/:uid', async (req, res) => {
  try {
    const uid = req.headers['uid']
    if (req.headers['shib-session-id'] && uid) {
      const asUser = req.params.uid
      const token = await userService.superlogin(uid, asUser)
      res.status(200).json(token)
    } else {
      res.status(401).json({
        message: `Not enough headers login, uid:
        ${req.headers.uid} session-id ${req.headers['shib-session-id']}`
      }).end()
    }
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: 'problem with login' })
  }
})

module.exports = router
