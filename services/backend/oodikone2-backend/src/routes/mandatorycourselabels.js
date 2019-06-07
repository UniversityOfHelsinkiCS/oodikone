const router = require('express').Router()
const MandatoryCourseLabels = require('../services/mandatoryCourseLabels')

router.get('/:programme/labels', async (req, res) => {
  const { programme } = req.params
  if (programme) {
    try {
      const labels = await MandatoryCourseLabels.labelsByStudyprogramme(programme)
      res.status(200).json(labels)
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

router.delete('/:programme/labels', async (req, res) => {
  const { programme } = req.params
  const { label } = req.body
  if (programme && label) {
    try {
      await MandatoryCourseLabels.destroy(programme, label)
      const labels = await MandatoryCourseLabels.labelsByStudyprogramme(programme)
      res.status(200).json(labels)
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

router.post('/:programme/move', async (req, res) => {
  const { programme } = req.params
  const { label, direction } = req.body
  if (programme && label) {
    try {
      await MandatoryCourseLabels.move(programme, label, direction)
      const labels = await MandatoryCourseLabels.labelsByStudyprogramme(programme)
      res.status(200).json(labels)
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

router.post('/:programme/labels', async (req, res) => {
  const { programme } = req.params
  const { label } = req.body
  if (programme && label) {
    try {
      await MandatoryCourseLabels.create(programme, label)
      const labels = await MandatoryCourseLabels.labelsByStudyprogramme(programme)
      res.status(200).json(labels)
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

module.exports = router