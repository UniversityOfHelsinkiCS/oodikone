const router = require('express').Router()
const Student = require('../services/students')
const User = require('../services/userService')
const Unit = require('../services/units')

router.get('/students', async (req, res) => {
  const { admin, czar, userId } = req.decodedToken
  if (admin || czar) {
    let results = []
    if (req.query.searchTerm) {
      results = await Student.bySearchTerm(req.query.searchTerm)
    }
    return res.json(results)
  } else {
    const unitsUserCanAccess = await User.getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    const matchingStudents = await Student.bySearchTermAndElements(req.query.searchTerm, codes)
    res.json(matchingStudents)
  }
})

router.get('/students/:id', async (req, res) => {
  const studentId = req.params.id
  const { admin, czar } = req.decodedToken
  if (admin || czar) {
    const results = await Student.withId(studentId)
    return res.json(results)
  }

  const uid = req.decodedToken.userId
  const student = await Student.withId(studentId)
  const units = await User.getUnitsFromElementDetails(uid)

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
