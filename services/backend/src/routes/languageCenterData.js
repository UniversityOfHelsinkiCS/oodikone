const router = require('express').Router()
const { getLanguageCenterData } = require('../services/languageCenterData')

router.get('/', async (req, res) => {
  const { iamGroups, isAdmin } = req.user
  if (!isAdmin && !iamGroups.includes('grp-kielikeskus-esihenkilot')) {
    return res.status(403).json({ error: 'Request failed because of missing rights' })
  }
  const result = await getLanguageCenterData()
  return res.json(result)
})

module.exports = router
