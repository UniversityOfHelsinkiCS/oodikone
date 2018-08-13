const router = require('express').Router()

router.get('/departmentsuccess', async (req, res) => {
  res.status(410).send('Deprecated')
})

module.exports = router
