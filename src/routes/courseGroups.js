const router = require('express').Router()

router.get('/courseGroups', async (req, res) => {
  res.json([
    { id: 1, name: 'Erityispedagogiikka' },
    { id: 2, name: 'Kasvatuspsykologia' }
  ])
})

module.exports = router
