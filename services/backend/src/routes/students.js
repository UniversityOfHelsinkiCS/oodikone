const router = require('express').Router()
const Student = require('../services/students')
const { ApplicationError } = require('../util/customErrors')

const filterStudentTags = (student, userId) => {
  return {
    ...student,
    tags: student.tags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId),
  }
}

router.get('/students', async (req, res) => {
  const {
    user: { isAdmin, studentsUserCanAccess },
    query: { searchTerm },
  } = req

  const trimmedSearchTerm = searchTerm ? searchTerm.trim() : undefined

  if (
    trimmedSearchTerm &&
    !Student.splitByEmptySpace(trimmedSearchTerm)
      .slice(0, 2)
      .find(t => t.length > 3)
  ) {
    throw new ApplicationError('at least one search term must be longer than 3 characters', 400)
  }

  let results = []
  if (trimmedSearchTerm) {
    results = isAdmin
      ? await Student.bySearchTerm(trimmedSearchTerm)
      : await Student.bySearchTermAndStudentNumbers(trimmedSearchTerm, studentsUserCanAccess)
  }
  res.json(results)
})

router.get('/students/:id', async (req, res) => {
  const { id: studentId } = req.params
  const {
    user: { id, isAdmin, studentsUserCanAccess },
  } = req

  if (!isAdmin && !studentsUserCanAccess.includes(studentId)) {
    throw new ApplicationError('Error finding student', 400)
  }
  const student = await Student.withId(studentId)
  const filteredTags = filterStudentTags(student, id)
  res.json(filteredTags)
})

module.exports = router
