import { Router } from 'express'

import { CustomPopulationSearch } from '@oodikone/shared/models/kone'
import { CanError } from '@oodikone/shared/routes'
import {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch,
  deleteCustomPopulationSearch,
} from '../services/customPopulationSearch'

const router = Router()

type GetCustomPopulationSearchResBody = CustomPopulationSearch[]

router.get<never, GetCustomPopulationSearchResBody>('/', async (req, res) => {
  const { id } = req.user
  const customPopulationSearches = await getCustomPopulationSearchesByUser(id)
  res.json(customPopulationSearches)
})

type PostCustomPopulationSearchReqBody = {
  name: string
  students: string[]
}
type PostCustomPopulationSearchResBody = CustomPopulationSearch

router.post<never, CanError<PostCustomPopulationSearchResBody>, PostCustomPopulationSearchReqBody>(
  '/',
  async (req, res) => {
    const { name, students } = req.body
    const { id } = req.user

    if (!name) {
      return res.status(400).json({ error: 'Name missing' })
    }
    if (students && !Array.isArray(students)) {
      return res.status(400).json({ error: 'Students must be of type array' })
    }

    const customPopulationSearch = await createCustomPopulationSearch(name, id, students ?? [])
    res.json(customPopulationSearch)
  }
)

type PutCustomPopulationSearchReqBody = {
  students: string[]
}
type PutCustomPopulationSearchResBody = CustomPopulationSearch

router.put<never, CanError<PutCustomPopulationSearchResBody>, PutCustomPopulationSearchReqBody>(
  '/:id',
  async (req, res) => {
    const { students } = req.body
    const { id } = req.params
    const { id: userId } = req.user

    if (!id) {
      return res.status(400).json({ error: 'Id missing' })
    }
    if (!students) {
      return res.status(400).json({ error: 'Students missing' })
    }
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Students must be of type array' })
    }

    const updatedPopulationSearch = await updateCustomPopulationSearch(userId, id, students)
    if (!updatedPopulationSearch) {
      return res.status(404).json({ error: 'Custom population search not found' })
    }

    res.json(updatedPopulationSearch)
  }
)

type DeleteCustomPopulationSearchParams = {
  id: string
}
type DeleteCustomPopulationSearchResBody = string

router.delete<never, CanError<DeleteCustomPopulationSearchResBody>, never, DeleteCustomPopulationSearchParams>(
  '/:id',
  async (req, res) => {
    const { id } = req.params
    const userId = req.user.id

    if (!id) {
      return res.status(400).json({ error: 'Id missing' })
    }

    const deletedSuccessfully = (await deleteCustomPopulationSearch(userId, id)) > 0

    if (!deletedSuccessfully) {
      return res.status(404).json({ error: 'Custom population search not found' })
    }

    res.json(id)
  }
)

export default router
