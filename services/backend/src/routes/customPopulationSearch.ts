import { Router } from 'express'

import {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch,
  deleteCustomPopulationSearch,
} from '../services/customPopulationSearch'
import { OodikoneRequest } from '../types'

const router = Router()

router.get('/', async (req: OodikoneRequest, res) => {
  const id = req.user!.id as unknown as bigint
  const customPopulationSearches = await getCustomPopulationSearchesByUser(id)
  res.json(customPopulationSearches)
})

router.post('/', async (req: OodikoneRequest, res) => {
  const {
    user,
    body: { name, students },
  } = req

  if (!name) {
    return res.status(400).json({ error: 'Name missing' })
  }
  if (students && !Array.isArray(students)) {
    return res.status(400).json({ error: 'Students must be of type array' })
  }

  const id = user!.id as unknown as bigint
  const customPopulationSearch = await createCustomPopulationSearch(name, id, students || [])
  res.json(customPopulationSearch)
})

router.put('/:id', async (req: OodikoneRequest, res) => {
  const {
    body: { students },
  } = req
  const id = req.params.id as unknown as bigint
  const userId = req.user!.id as unknown as bigint

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
})

router.delete('/:id', async (req: OodikoneRequest, res) => {
  const id = req.params.id as unknown as bigint
  const userId = req.user!.id as unknown as bigint

  if (!id) {
    return res.status(400).json({ error: 'Id missing' })
  }

  const deletedSuccessfully = (await deleteCustomPopulationSearch(userId, id)) > 0

  if (!deletedSuccessfully) {
    return res.status(404).json({ error: 'Custom population search not found' })
  }

  res.json(id)
})

export default router
