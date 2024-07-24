import { Router } from 'express'
import moment from 'moment-timezone'

import {
  getOpenUniSearches,
  createNewSearch,
  deleteSearch,
  updateSearch,
} from '../services/openUni/openUniManageSearches'
import { getCustomOpenUniCourses } from '../services/openUni/openUniStats'
import { OodikoneRequest } from '../types'

const router = Router()

router.get('/', async (req: OodikoneRequest, res) => {
  const courseCodes = JSON.parse(req.query?.courselist as string) || []
  const startdate = req.query?.startdate || moment('01-08-2017 00:00:00', 'DD-MM-YYYY')
  const enddate = req.query?.enddate || moment().endOf('day')
  if (!Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Courses must be of type array' })
  }
  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes, startdate, enddate)
  return res.json(customOpenUniSearches)
})

router.get('/searches', async (req: OodikoneRequest, res) => {
  const userId = req.user!.id
  const foundSearches = await getOpenUniSearches(userId)
  return res.json(foundSearches)
})

router.post('/searches', async (req: OodikoneRequest, res) => {
  const courseCodes = req.body?.courselist || []
  const userId = req.user!.id
  const name = req.body?.name
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

router.put('/searches/:id', async (req: OodikoneRequest, res) => {
  const id = req.params?.id
  const courseCodes = req.body?.courselist || []
  const userId = req.user!.id
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

router.delete('/searches/:id', async (req: OodikoneRequest, res) => {
  const id = req.params?.id
  const userId = req.user!.id
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
