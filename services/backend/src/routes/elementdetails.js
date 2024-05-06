const router = require('express').Router()
const { getAllProgrammes, getAllElementDetails } = require('../services/studyrights')

router.get('/elementdetails/all', async (_req, res) => {
  const elementdetails = await getAllElementDetails()
  res.json(elementdetails)
})

router.get('/studyprogrammes', async (_req, res) => {
  const studyrights = await getAllProgrammes()
  res.json(studyrights)
})

module.exports = router
