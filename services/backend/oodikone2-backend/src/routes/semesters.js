const router = require('express').Router()
const { getSemestersAndYears } = require('../services/semesters')
const semestersV2 = require('../routesV2/semesters')
const useSisRouter = require('../util/useSisRouter')

router.get('/semesters/codes', async (req, res) => {
  const providers = await getSemestersAndYears()
  res.json(providers)
})

module.exports = useSisRouter(semestersV2, router)
