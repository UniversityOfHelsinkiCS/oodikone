import { Router } from 'express'

import type { CanError } from '@oodikone/shared/routes'
import type {
  GetStudentRequestResBody,
  GetStudentRequestReqBody,
  GetStudentRequestQuery,
  GetStudentDetailParams,
  GetStudentDetailResBody,
  GetStudentDetailReqBody,
} from '@oodikone/shared/routes/students'
import { splitByEmptySpace } from '@oodikone/shared/util'
import { bySearchTermAndStudentNumbers, withStudentNumber } from '../services/students'
import { hasFullAccessToStudentData } from '../util'

const router = Router()

router.get<never, CanError<GetStudentRequestResBody>, GetStudentRequestReqBody, GetStudentRequestQuery>(
  '/',
  async (req, res) => {
    const { searchTerm } = req.query
    const trimmedSearchTerm = searchTerm?.trim()
    const validSearchTerm =
      trimmedSearchTerm &&
      !splitByEmptySpace(trimmedSearchTerm)
        .slice(0, 2)
        .find(term => term.length > 2)

    if (!trimmedSearchTerm || validSearchTerm) {
      return res.status(400).json({ error: 'at least one search term must be longer than 2 characters' })
    }

    const { roles, studentsUserCanAccess } = req.user
    const results: ReturnType<typeof bySearchTermAndStudentNumbers> = hasFullAccessToStudentData(roles)
      ? bySearchTermAndStudentNumbers(trimmedSearchTerm)
      : bySearchTermAndStudentNumbers(trimmedSearchTerm, studentsUserCanAccess)

    return res.json(await results)
  }
)

router.get<GetStudentDetailParams, CanError<GetStudentDetailResBody>, GetStudentDetailReqBody>(
  '/:studentNumber',
  async (req, res) => {
    const { studentNumber } = req.params
    const { id, roles, studentsUserCanAccess } = req.user

    if (!hasFullAccessToStudentData(roles) && !studentsUserCanAccess.includes(studentNumber))
      return res.status(403).json({ error: 'User does not have permission to view current student.' })

    const student = await withStudentNumber(studentNumber, id)
    if (!student) return res.status(404).json({ error: 'Student not found' })

    res.json(student)
  }
)

export default router
