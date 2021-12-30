const router = require('express').Router()
const { ApplicationError } = require('../util/customErrors')

router.get('/login', async (req, res) => {
  const { decodedToken, logoutUrl } = req

  if (!decodedToken) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    token: decodedToken,
    logoutUrl,
  })

  // handle the isNew thingy and mail sending somewhere!
  // let { token, isNew } = await userService.login(uid, full_name, hyGroups, affiliations, mail, hyPersonSisuId)
  // if (isNew) {
  //   const result = await sendNotificationAboutNewUser({ userId: uid, userFullName: full_name })
  //   if (result.error) {
  //     return res.status(400).json(result).end()
  //   }
  // }
  // res.status(200).json({ token })
})
module.exports = router
