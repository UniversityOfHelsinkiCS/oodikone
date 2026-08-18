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
  mode: 'studentNumbers' | 'programmes'
  students: string[]
  programmes: { code: string; name: string }[]
  year: string
}
type PostCustomPopulationSearchResBody = CustomPopulationSearch

router.post<never, CanError<PostCustomPopulationSearchResBody>, PostCustomPopulationSearchReqBody>(
  '/',
  async (req, res) => {
    const { name, mode, students, programmes, year } = req.body
    const { id } = req.user

    if (!name) {
      return res.status(400).json({ error: 'Name missing' })
    }
    if (!mode) {
      return res.status(400).json({ error: 'Search mode missing!!!' })
    }

    if (mode === 'studentNumbers' && students && !Array.isArray(students))
      return res.status(400).json({ error: 'Students must be of type array' })

    if (mode === 'programmes' && !year) return res.status(400).json({ error: 'Year missing' })
    if (mode === 'programmes' && programmes && !Array.isArray(programmes))
      return res.status(400).json({ error: 'Programmes must be of type array' })

    const customPopulationSearch = await createCustomPopulationSearch(
      name,
      id,
      mode,
      students ?? [],
      programmes ?? [],
      year
    )
    res.json(customPopulationSearch)
  }
)

type PutCustomPopulationSearchReqBody = {
  mode: 'studentNumbers' | 'programmes'
  students: string[]
  programmes: { code: string; name: string }[]
  year: string
}
type PutCustomPopulationSearchResBody = CustomPopulationSearch

router.put<never, CanError<PutCustomPopulationSearchResBody>, PutCustomPopulationSearchReqBody>(
  '/:id',
  async (req, res) => {
    const { mode, students, programmes, year } = req.body
    const { id } = req.params
    const { id: userId } = req.user

    if (!id) {
      return res.status(400).json({ error: 'Id missing' })
    }
    if (!mode) {
      return res.status(400).json({ error: 'Search mode missing' })
    }

    if (mode === 'studentNumbers' && students && !Array.isArray(students))
      return res.status(400).json({ error: 'Students must be of type array' })

    if (mode === 'programmes' && !year) return res.status(400).json({ error: 'Year missing' })
    if (mode === 'programmes' && programmes && !Array.isArray(programmes))
      return res.status(400).json({ error: 'Programmes must be of type array' })

    const updatedPopulationSearch = await updateCustomPopulationSearch(userId, id, mode, students, programmes, year)
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
