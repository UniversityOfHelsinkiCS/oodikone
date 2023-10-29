const router = require('express').Router()
const { getLanguageCenterData, getLanguageCenterCourses } = require('../services/languageCenterData')

router.get('/', async (req, res) => {
  const { iamGroups, isAdmin } = req.user
  if (!isAdmin && !iamGroups.includes('grp-kielikeskus-esihenkilot')) {
    return res.status(403).json({ error: 'Request failed because of missing rights' })
  }
  const result = await getLanguageCenterData()
  return res.json(result)
})

router.get('/courses', async (req, res) => {
  const { iamGroups, isAdmin } = req.user
  if (!isAdmin && !iamGroups.includes('grp-kielikeskus-esihenkilot')) {
    return res.status(403).json({ error: 'Request failed because of missing rights' })
  }
  const result = await getLanguageCenterCourses()
  return res.json(result)
})

module.exports = router
