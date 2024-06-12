const router = require('express').Router()
const _ = require('lodash')

import { Student } from '../database/connection'

router.get('/', async (req, res) => {
  const results = []

  const s = await Student.findOne({})

  return res.send(s)
})

module.exports = router
