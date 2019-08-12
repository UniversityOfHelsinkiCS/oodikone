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
    await Tags.createNewTag(tag)
    const tags = await Tags.findTagsByStudytrack(tag.studytrack)
    res.status(200).json(tags)
  } catch (err) {
    console.log(err)
    res.status(400).json(err.message)
  }
})

router.delete('/tags', async (req, res) => {
  const { tag } = req.body
  try {
    await Tags.deleteTag(tag)
    const t = await Tags.findTagsByStudytrack(tag.studytrack)
    res.status(200).json(t)
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

router.get('/studenttags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  try {
    const result = await TagStudent.getStudentTagsByStudytrack(studytrack)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.get('/studenttags/:studentnumber', async (req, res) => {
  const { studentnumber } = req.params
  try {
    const result = await TagStudent.getStudentTagsByStudentnumber(studentnumber)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.post('/studenttags/:studentnumber', async (req, res) => {
  const { tag, studytrack } = req.body
  try {
    await TagStudent.createStudentTag(tag)
    const result = await TagStudent.getStudentTagsByStudytrack(studytrack)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.post('/studenttags', async (req, res) => {
  const { tags, studytrack } = req.body
  try {
    await TagStudent.createMultipleStudentTags(tags)
    const result = await TagStudent.getStudentTagsByStudytrack(studytrack)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

router.delete('/studenttags', async (req, res) => {
  const { id, studytrack } = req.body
  try {
    await TagStudent.deleteStudentTag(id)
    const result = await TagStudent.getStudentTagsByStudytrack(studytrack)
    res.status(200).json(result)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

module.exports = router
