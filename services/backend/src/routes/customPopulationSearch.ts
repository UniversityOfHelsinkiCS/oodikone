import { Request, Response, Router } from 'express'

import {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch,
  deleteCustomPopulationSearch,
} from '../services/customPopulationSearch'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { id } = req.user
  const customPopulationSearches = await getCustomPopulationSearchesByUser(id)
  res.json(customPopulationSearches)
})

router.post('/', async (req: Request, res: Response) => {
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
})

router.put('/:id', async (req: Request, res: Response) => {
  const { students } = req.body
  const { id } = req.params
  const userId = req.user.id

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

router.delete('/:id', async (req: Request, res: Response) => {
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
})

export default router
