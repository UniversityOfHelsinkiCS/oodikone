const router = require('express').Router()

const {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch,
  deleteCustomPopulationSearch,
} = require('../services/customPopulationSearch')

router.get('/', async (req, res) => {
  const {
    user: { id },
  } = req
  const customPopulationSearches = await getCustomPopulationSearchesByUser(id)
  res.json(customPopulationSearches)
})

router.post('/', async (req, res) => {
  const {
    user: { id },
    body: { name, students },
  } = req

  if (!name) return res.status(400).json({ error: 'name missing' })
  if (students && !Array.isArray(students)) res.status(400).json({ error: 'students must be of type array' })

  const customPopulationSearch = await createCustomPopulationSearch(name, id, students || [])
  res.json(customPopulationSearch)
})

router.put('/:id', async (req, res) => {
  const {
    user: { id: userId },
    body: { students },
  } = req
  const { id } = req.params

  if (!id) return res.status(400).json({ error: 'id missing' })
  if (!students) return res.status(400).json({ error: 'students missing' })
  if (!Array.isArray(students)) res.status(400).json({ error: 'students must be of type array' })

  const updatedPopulationSearch = await updateCustomPopulationSearch(userId, id, students)
  if (!updatedPopulationSearch) return res.status(404).json({ error: 'custom population search not found' })

  res.json(updatedPopulationSearch)
})

router.delete('/:id', async (req, res) => {
  const {
    user: { id: userId },
  } = req
  const { id } = req.params

  if (!id) return res.status(400).json({ error: 'id missing' })

  const deletedSuccessfully = (await deleteCustomPopulationSearch(userId, id)) > 0

  if (!deletedSuccessfully) return res.status(404).json({ error: 'custom population search not found' })

  res.json(id)
})

module.exports = router
