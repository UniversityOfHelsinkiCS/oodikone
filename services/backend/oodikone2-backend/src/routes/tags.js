const router = require('express').Router()
const Tags = require('../services/tags')
const TagStudent = require('../services/tagstudent')

router.get('/tags', async (req, res) => {
  try {
    const tags = await Tags.findTags()
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

router.get('/studenttags', async (req, res) => {
  try {
    const result = await TagStudent.getStudentTags()
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.post('/studenttags', async (req,res) => {
  console.log('trying to post?')
})

module.exports = router
