const router = require('express').Router()

const { bySearchTermAndStudentNumbers, withStudentNumber } = require('../services/students')
const { hasFullAccessToStudentData, splitByEmptySpace } = require('../util')
const { ApplicationError } = require('../util/customErrors')

const filterStudentTags = (student, userId) => {
  return {
    ...student,
    tags: (student.tags ?? []).filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId),
  }
}

router.get('/', async (req, res) => {
  const {
    user: { roles, studentsUserCanAccess },
    query: { searchTerm },
  } = req

  const trimmedSearchTerm = searchTerm ? searchTerm.trim() : undefined

  if (
    trimmedSearchTerm &&
    !splitByEmptySpace(trimmedSearchTerm)
      .slice(0, 2)
      .find(t => t.length > 2)
  ) {
    throw new ApplicationError('at least one search term must be longer than 2 characters', 400)
  }

  let results = []
  if (trimmedSearchTerm) {
    results = hasFullAccessToStudentData(roles)
      ? await bySearchTermAndStudentNumbers(trimmedSearchTerm)
      : await bySearchTermAndStudentNumbers(trimmedSearchTerm, studentsUserCanAccess)
  }
  res.json(results)
})

router.get('/:studentNumber', async (req, res) => {
  const { studentNumber } = req.params
  const {
    user: { id, roles, studentsUserCanAccess },
  } = req

  if (!hasFullAccessToStudentData(roles) && !studentsUserCanAccess.includes(studentNumber)) {
    throw new ApplicationError('Error finding student', 400)
  }
  const student = await withStudentNumber(studentNumber)
  const filteredTags = filterStudentTags(student, id)
  res.json(filteredTags)
})

module.exports = router
