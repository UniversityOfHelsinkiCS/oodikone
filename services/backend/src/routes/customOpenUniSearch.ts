import { Router } from 'express'

import { CanError } from '@oodikone/shared/routes'
import {
  getOpenUniSearches,
  createNewSearch,
  deleteSearch,
  updateSearch,
} from '../services/openUni/openUniManageSearches'
import { getCustomOpenUniCourses } from '../services/openUni/openUniStats'
import { safeJSONParse } from '../util'

const router = Router()

type SearchResBody = CanError<Awaited<ReturnType<typeof getCustomOpenUniCourses>>>
type SearchReqBody = never
type SearchQuery = {
  courselist: string
  startdate: string
  enddate: string
}

router.get<never, SearchResBody, SearchReqBody, SearchQuery>('/', async (req, res) => {
  const { courselist, startdate, enddate } = req.query

  const courseCodes = (await safeJSONParse(courselist)) || []
  if (!Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Courses must be of type array' })
  }

  const startDate = startdate !== 'null' ? new Date(startdate) : new Date(2017, 7, 1, 0, 0, 0)
  const endDate = enddate !== 'null' ? new Date(enddate) : new Date()
  if (enddate === 'null') {
    endDate.setHours(23, 59, 59, 999)
  }

  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes, startDate, endDate)
  return res.json(customOpenUniSearches)
})

type GetSearchResBody = Awaited<ReturnType<typeof getOpenUniSearches>>
router.get<never, GetSearchResBody>('/searches', async (req, res) => {
  const { id: userId } = req.user
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
  const { courselist, name } = req.body
  const { id: userId } = req.user

  const courseCodes = courselist || []

  if (!name) {
    return res.status(400).json({ error: 'Name missing' })
  }

  if (courseCodes && !Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Course codes must be type of array' })
  }

  const createdSearch = await createNewSearch(userId, name, courseCodes)
  if (!createdSearch) {
    return res.status(400).json({ error: 'Failed to create search' })
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
  const { courselist } = req.body
  const { id: userId } = req.user

  const courseCodes = courselist || []

  if (!id || !userId) {
    return res.status(422).end()
  }

  const updatedSearch = await updateSearch(userId, id, courseCodes)
  if (!updatedSearch) {
    return res.status(404).json({ error: 'Open uni search could not be found' })
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
    return res.status(404).json({ error: 'Open uni search could not be found' })
  }

  return res.json(id)
})

export default router
