const router = require('express').Router()
const {
  getCustomPopulationSearchesByUser,
  createCustomPopulationSearch,
  updateCustomPopulationSearch
} = require('../services/customPopulationSearch')

router.get('/', async (req, res) => {
  try {
    const {
      decodedToken: { id }
    } = req
    const customPopulationSearches = await getCustomPopulationSearchesByUser(id)
    res.json(customPopulationSearches)
  } catch (e) {
    console.error('e', e)
    res.status(500).json({ error: 'error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      decodedToken: { id },
      body: { name, students }
    } = req

    if (!name) return res.status(400).json({ error: 'name missing' })
    if (students && !Array.isArray(students)) res.status(400).json({ error: 'students must be of type array' })

    const customPopulationSearch = await createCustomPopulationSearch(name, id, students || [])
    res.json(customPopulationSearch)
  } catch (e) {
    console.error('e', e)
    res.status(500).json({ error: 'error' })
  }
})

router.put('/', async (req, res) => {
  try {
    const {
      decodedToken: { id: userId },
      body: { id, students }
    } = req

    if (!id) return res.status(400).json({ error: 'id missing' })
    if (!students) return res.status(400).json({ error: 'students missing' })
    if (!Array.isArray(students)) res.status(400).json({ error: 'students must be of type array' })

    const updatedPopulationSearch = await updateCustomPopulationSearch(userId, id, students)
    if (!updatedPopulationSearch) return res.status(404).json({ error: 'custom population search not found' })

    res.json(updatedPopulationSearch)
  } catch (e) {
    console.error('e', e)
    res.status(500).json({ error: 'error' })
  }
})

module.exports = router
