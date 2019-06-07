const router = require('express').Router()
const Tags = require('../services/tags')


router.get('/tags', async (req, res) => {
  console.log('request got to routes')
  try {
    const tags = await Tags.findTags()
    console.log('response', tags)
    res.status(200).json(tags)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.post('/tags', async (req, res) => {
  const { tag } = req.body
  try {
    const result = await Tags.createNewTag(tag)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err.message)
  }
})

module.exports = router