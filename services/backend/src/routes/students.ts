import { Request, Response, Router } from 'express'

import { bySearchTermAndStudentNumbers, withStudentNumber } from '../services/students'
import { hasFullAccessToStudentData, splitByEmptySpace } from '../util'
import { ApplicationError } from '../util/customErrors'

const router = Router()

const filterStudentTags = (student: Awaited<ReturnType<typeof withStudentNumber>>, userId: string) => {
  if (!student) return null
  return {
    ...student,
    tags: (student.tags ?? []).filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId),
  }
}

interface GetStudentsRequest extends Request {
  query: {
    searchTerm: string
  }
}

router.get('/', async (req: GetStudentsRequest, res: Response) => {
  const {
    user: { roles, studentsUserCanAccess },
    query: { searchTerm },
  } = req

  const trimmedSearchTerm = searchTerm ? searchTerm.trim() : undefined

  if (
    trimmedSearchTerm &&
    !splitByEmptySpace(trimmedSearchTerm)
      .slice(0, 2)
      .find(term => term.length > 2)
  ) {
    throw new ApplicationError('at least one search term must be longer than 2 characters', 400)
  }

  let results: Awaited<ReturnType<typeof bySearchTermAndStudentNumbers>> = []
  if (trimmedSearchTerm) {
    results = hasFullAccessToStudentData(roles)
      ? await bySearchTermAndStudentNumbers(trimmedSearchTerm)
      : await bySearchTermAndStudentNumbers(trimmedSearchTerm, studentsUserCanAccess)
  }
  res.json(results)
})

interface GetStudentRequest extends Request {
  params: {
    studentNumber: string
  }
}

router.get('/:studentNumber', async (req: GetStudentRequest, res: Response) => {
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

export default router
