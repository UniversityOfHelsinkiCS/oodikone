const router = require('express').Router()

const { bySearchTerm, bySearchTermAndStudentNumbers, withId } = require('../services/students')
const { ApplicationError } = require('../util/customErrors')
const { hasFullAccessToStudentData, splitByEmptySpace } = require('../util/utils')

const filterStudentTags = (student, userId) => {
  return {
    ...student,
    tags: student.tags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId),
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
      .find(t => t.length > 3)
  ) {
    throw new ApplicationError('at least one search term must be longer than 3 characters', 400)
  }

  let results = []
  if (trimmedSearchTerm) {
    results = hasFullAccessToStudentData(roles)
      ? await bySearchTerm(trimmedSearchTerm)
      : await bySearchTermAndStudentNumbers(trimmedSearchTerm, studentsUserCanAccess)
  }
  res.json(results)
})

router.get('/:id', async (req, res) => {
  const { id: studentId } = req.params
  const {
    user: { id, roles, studentsUserCanAccess },
  } = req

  if (!hasFullAccessToStudentData(roles) && !studentsUserCanAccess.includes(studentId)) {
    throw new ApplicationError('Error finding student', 400)
  }
  const student = await withId(studentId)
  const filteredTags = filterStudentTags(student, id)
  res.json(filteredTags)
})

module.exports = router
