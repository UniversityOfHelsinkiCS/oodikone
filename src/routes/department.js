const router = require('express').Router()

router.get('/departmentsuccess', async (req, res) => {
  const GONE = 410
  res.status(GONE).send('Deprecated')
})

module.exports = router
