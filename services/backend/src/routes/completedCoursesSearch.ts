import { Router } from 'express'
import { difference, intersection } from 'lodash'

import { CanError } from '@oodikone/shared/routes'
import { tryCatch } from '@oodikone/shared/util'
import { Courses, FormattedStudent, getCompletedCourses } from '../services/completedCoursesSearch'
import {
  getOpenUniSearches,
  createNewSearch,
  deleteSearch,
  updateSearch,
  FoundSearch,
} from '../services/openUni/openUniManageSearches'
import { hasFullAccessToStudentData, safeJSONParse } from '../util'
import { getImporterClient } from '../util/importerClient'
import logger from '../util/logger'

const router = Router()

const importerClient = getImporterClient()

export type SearchResBody = CanError<
  { discardedStudentNumbers: string[] } & { students: Omit<FormattedStudent, 'allEnrollments'>[]; courses: Courses }
>
export type SearchReqBody = never
export type SearchQuery = {
  studentlist: string
  courselist: string
}

router.get<never, SearchResBody, SearchReqBody, SearchQuery>('/', async (req, res) => {
  const { studentlist, courselist } = req.query
  const studentNumbers: string[] = (await safeJSONParse(studentlist)) ?? []
  const courseCodes: string[] = (await safeJSONParse(courselist)) ?? []

  const { roles, studentsUserCanAccess, sisPersonId: teacherId } = req.user

  if (!Array.isArray(studentNumbers)) {
    return res.status(400).json({ error: 'Student numbers must be of type array' })
  }
  if (!Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Courses must be of type array' })
  }

  // Teachers can also get rights to students via Importer if
  // the students have enrolled to their courses in last 8 months
  // (acual logic a bit different, see Importer)
  const { data: teacherRightsToStudents, error } = importerClient
    ? await tryCatch<{ data: string[] }>(importerClient.post('/teacher-rights/', { teacherId, studentNumbers }))
    : { data: null, error: null }

  if (error) {
    logger.error(`Importer teacher-rights request failed with message: ${error?.message}`)
  } else if (teacherRightsToStudents && Array.isArray(teacherRightsToStudents.data)) {
    studentsUserCanAccess.push(...teacherRightsToStudents.data)
  }

  const filteredStudentNumbers = hasFullAccessToStudentData(roles)
    ? studentNumbers
    : intersection(studentNumbers, studentsUserCanAccess)

  const completedCourses = await getCompletedCourses(filteredStudentNumbers, courseCodes)
  const discardedStudentNumbers = difference(
    studentNumbers,
    completedCourses.students.map(student => student.studentNumber)
  )

  return res.json({ discardedStudentNumbers, ...completedCourses })
})

export type GetSearchResBody = FoundSearch[]

router.get<never, GetSearchResBody>('/searches', async (req, res) => {
  const userId = req.user.id
  const foundSearches = await getOpenUniSearches(userId)
  return res.json(foundSearches)
})

export type CreateSearchResBody = CanError<{
  id: string
  userId: string
  name: string
  courseList: string[]
  updatedAt: string
}>
export type CreateSearchReqBody = {
  courselist: string[]
  name: string
}

router.post<never, CreateSearchResBody, CreateSearchReqBody>('/searches', async (req, res) => {
  const courseCodes = req.body?.courselist || []
  const name = req.body?.name
  const userId = req.user.id
  if (!name) {
    return res.status(400).json({ error: 'Name missing' })
  }
  if (courseCodes && !Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Courselist must be type of array' })
  }
  const createdSearch = await createNewSearch(userId, name, courseCodes)
  if (!createdSearch) {
    return res.status(400).json({ error: 'Failed to create courselist' })
  }
  return res.status(201).json({
    id: createdSearch.id,
    userId: createdSearch.userId,
    name: createdSearch.name,
    courseList: createdSearch.courseCodes,
    updatedAt: createdSearch.updatedAt,
  })
})

export type UpdateSearchParams = { id: string }
export type UpdateSearchResBody = CanError<{
  id: string
  userId: string
  name: string
  courseList: string[]
  updatedAt: string
} | void>
export type UpdateSearchReqBody = { courselist: string[] }

router.put<UpdateSearchParams, UpdateSearchResBody, UpdateSearchReqBody>('/searches/:id', async (req, res) => {
  const { id } = req.params
  const { courselist: courseCodes = [] } = req.body
  const { id: userId } = req.user

  if (!id || !userId) {
    return res.status(422).end()
  }

  const updatedSearch = await updateSearch(userId, id, courseCodes)
  if (!updatedSearch) {
    return res.status(404).json({ error: 'Courselist could not be found' })
  }

  return res.json({
    id: updatedSearch.id,
    userId: updatedSearch.userId,
    name: updatedSearch.name,
    courseList: updatedSearch.courseCodes,
    updatedAt: updatedSearch.updatedAt,
  })
})

export type DeleteSearchParams = { id: string }
export type DeleteSearchResBody = CanError<string | void>

router.delete<DeleteSearchParams, DeleteSearchResBody>('/searches/:id', async (req, res) => {
  const { id } = req.params
  const { id: userId } = req.user

  if (!id || !userId) {
    return res.status(422).end()
  }

  const deletedSearch = await deleteSearch(userId, id)
  if (!deletedSearch) {
    return res.status(404).json({ error: 'Courselist could not be found' })
  }

  return res.json(id)
})

export default router
