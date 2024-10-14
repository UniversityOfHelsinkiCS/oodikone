import { Request, Response, Router } from 'express'

import {
  getOpenUniSearches,
  createNewSearch,
  deleteSearch,
  updateSearch,
} from '../services/openUni/openUniManageSearches'
import { getCustomOpenUniCourses } from '../services/openUni/openUniStats'

const router = Router()

interface GetSearchRequest extends Request {
  query: {
    courselist: string
    startdate: string
    enddate: string
  }
}

router.get('/', async (req: GetSearchRequest, res: Response) => {
  const courseCodes = JSON.parse(req.query?.courselist) || []
  const startDate = req.query?.startdate !== 'null' ? new Date(req.query.startdate) : new Date(2017, 7, 1, 0, 0, 0)
  const endDate = req.query?.enddate !== 'null' ? new Date(req.query.enddate) : new Date()
  if (req.query?.enddate === 'null') {
    endDate.setHours(23, 59, 59, 999)
  }

  if (!Array.isArray(courseCodes)) {
    return res.status(400).json({ error: 'Courses must be of type array' })
  }
  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes, startDate, endDate)
  return res.json(customOpenUniSearches)
})

router.get('/searches', async (req: Request, res: Response) => {
  const userId = req.user.id
  const foundSearches = await getOpenUniSearches(userId)
  return res.json(foundSearches)
})

interface CreateSearchRequest extends Request {
  body: {
    courselist: string[]
    name: string
  }
}

router.post('/searches', async (req: CreateSearchRequest, res: Response) => {
  const courseCodes = req.body?.courselist || []
  const name = req.body?.name
  const userId = req.user.id
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

interface UpdateSearchRequest extends Request {
  body: {
    courselist: string[]
  }
  params: {
    id: string
  }
}

router.put('/searches/:id', async (req: UpdateSearchRequest, res: Response) => {
  const id = req.params?.id
  const courseCodes = req.body?.courselist || []
  const userId = req.user.id
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

interface DeleteSearchRequest extends Request {
  params: {
    id: string
  }
}

router.delete('/searches/:id', async (req: DeleteSearchRequest, res: Response) => {
  const id = req.params?.id
  const userId = req.user.id
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
