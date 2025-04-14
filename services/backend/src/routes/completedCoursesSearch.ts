import { Router } from 'express'
import { difference, intersection } from 'lodash'

import { getCompletedCourses } from '../services/completedCoursesSearch'
import {
  getOpenUniSearches,
  createNewSearch,
  deleteSearch,
  updateSearch,
} from '../services/openUni/openUniManageSearches'
import { tryCatch } from '../shared/util'
import { CanError } from '../types'
import { hasFullAccessToStudentData, safeJSONParse } from '../util'
import { getImporterClient } from '../util/importerClient'
import logger from '../util/logger'

const router = Router()

const importerClient = getImporterClient()

type SearchResBody = CanError<
  {
    discardedStudentNumbers: string[]
  } & Awaited<ReturnType<typeof getCompletedCourses>>
>
type SearchReqBody = never
type SearchQuery = {
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

  const answerTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 6000))

  // Teachers can also get rights to students via Importer if
  // the students have enrolled to their courses in last 8 months
  // (acual logic a bit different, see Importer)
  const { data: teacherRightsToStudents, error } = importerClient
    ? await Promise.race([
        tryCatch<{ data: string[] }>(importerClient.post('/teacher-rights/', { teacherId, studentNumbers })),
        tryCatch<any>(answerTimeout), // This will always reject with an Error
      ])
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

type GetSearchResBody = Awaited<ReturnType<typeof getOpenUniSearches>>
router.get<never, GetSearchResBody>('/searches', async (req, res) => {
  const userId = req.user.id
  const foundSearches = await getOpenUniSearches(userId)
  return res.json(foundSearches)
})

type CreateSearchResBody = CanError<{
  id: string
  userId: string
  name: string
  courseList: string[]
  updatedAt: string
}>
type CreateSearchReqBody = {
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

type UpdateSearchParams = {
  id: string
}
type UpdateSearchResBody = CanError<{
  id: string
  userId: string
  name: string
  courseList: string[]
  updatedAt: string
}>
type UpdateSearchReqBody = {
  courselist: string[]
}

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

type DeleteSearchParams = {
  id: string
}
type DeleteSearchResBody = CanError<string>

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
