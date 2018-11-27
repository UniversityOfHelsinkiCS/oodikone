const router = require('express').Router()

router.get('/courseGroups', async (req, res) => {
  res.json([
    { id: 1, name: 'Erityispedagogiikka' },
    { id: 2, name: 'Kasvatuspsykologia' }
  ])
})

router.get('/courseGroups/:id/teachers', async (req, res) => {
  if (req.params.id === '1') {
    return res.json([
      '017715',
      '019051',
      '053532',
      '028579',
      '036199',
      '083257',
      '089822',
      '128474'
    ])
  }

  return res.send(404)
})

module.exports = router
