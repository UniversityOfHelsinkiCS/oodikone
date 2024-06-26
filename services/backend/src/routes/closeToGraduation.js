const router = require('express').Router()

const { getCloseToGraduationData } = require('../services/populations/closeToGraduation')
const { getAllStudentsUserHasInGroups } = require('../services/studyGuidanceGroups')
const { hasFullAccessToStudentData } = require('../util')

router.get('/', async (req, res) => {
  if (hasFullAccessToStudentData(req.user.roles)) {
    const result = await getCloseToGraduationData()
    return res.json(result)
  }
  const studentsInUsersGuidanceGroups = await getAllStudentsUserHasInGroups(req.user.sisPersonId)
  const result = await getCloseToGraduationData(studentsInUsersGuidanceGroups)
  res.json(result)
})

module.exports = router
