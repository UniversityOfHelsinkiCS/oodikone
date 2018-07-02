const router = require('express').Router()
const Student = require('../services/students')
const User = require('../services/users')
const Unit = require('../services/units')

router.get('/students', async (req, res) => {
  if (req.decodedToken.admin) {
    let results = []
    if (req.query.searchTerm) {
      results = await Student.bySearchTerm(req.query.searchTerm)
    }
    return res.json(results)
  } else {

    let results = []
    const uid = req.decodedToken.userId
    const units = await User.getUnitsFromElementDetails(uid)

    if (req.query.searchTerm) {
      results = await Student.bySearchTerm(req.query.searchTerm)
    }
    const filteredResults = [] // Filter students away
    await Promise.all(results.map(async student => {
      const rights = await Promise.all(units.map(async unit => {
        const jtn = await Unit.hasStudent(unit.id, student.studentNumber)
        return jtn
      }))
      if (rights.some(right => right !== null)) {
        filteredResults.push(student)
      }
    }))


    res.json(filteredResults)
  }
})

router.get('/students/:id', async (req, res) => {
  const studentId = req.params.id
  if (req.decodedToken.admin) {
    const results = await Student.withId(studentId)
    return res.json(results)
  } 

  const uid = req.decodedToken.userId
  const student = await Student.withId(studentId)
  const user = await User.byUsername(uid)
  const units = await User.getUnits(user.id)

  const rights = await Promise.all(units.map(async unit => {
    const jtn = await Unit.hasStudent(unit.id, student.studentNumber)
    return jtn
  }))

  if (rights.some(right => right !== null)) {
    res.json(student).end()
  } else {
    res.json([]).end()
  }

})

module.exports = router
