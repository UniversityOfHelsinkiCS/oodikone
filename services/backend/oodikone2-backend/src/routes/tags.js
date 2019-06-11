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

router.get('/tags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  try {
    const tags = await Tags.findTagsByStudytrack(studytrack)
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

router.delete('/tags', async (req, res) => {
  const { tag } = req.body
  try {
    const result = await Tags.deleteTag(tag)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
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

router.post('/studenttags', async (req, res) => {
  const { tag } = req.body
  try {
    const result = await TagStudent.createStudentTag(tag)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.delete('/studenttags', async (req, res) => {
  const { tag } = req.body
  try {
    const result = await TagStudent.deleteStudentTag(tag)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

module.exports = router
