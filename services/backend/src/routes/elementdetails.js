const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')
const {
  productivityStatsForStudytrack,
  throughputStatsForStudytrack,
  optionData,
} = require('../services/studyprogramme')
const { findProgrammeTheses, createThesisCourse, deleteThesisCourse } = require('../services/thesis')
const {
  getProductivity,
  setProductivity,
  getThroughput,
  setThroughput,
  patchProductivity,
  patchThroughput,
} = require('../services/analyticsService')
const { getAllProgrammes, getAllElementDetails } = require('../services/studyrights')
const logger = require('../util/logger')

const programmeStatsSince = new Date('2017-07-31')

router.get('/elementdetails/all', async (req, res) => {
  const elementdetails = await getAllElementDetails()
  res.json(elementdetails)
})

router.get('/studyprogrammes', async (req, res) => {
  const studyrights = await getAllProgrammes()
  res.json(studyrights)
})

router.get('/v2/studyprogrammes/:id/optiondata', async (req, res) => {
  const code = req.params.id

  let level
  if (code.includes('MH')) {
    level = 'MSC'
  } else if (code.includes('KH')) {
    level = 'BSC'
  } else {
    return res.json([])
  }

  const data = await optionData(new Date('2017-07-31'), new Date(), code, level)
  res.json(data)
})

router.get('/v2/studyprogrammes/:id/mandatory_courses', async (req, res) => {
  if (req.params.id) {
    const codes = await MandatoryCourses.byStudyprogramme(req.params.id)
    res.json(codes)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/productivity', async (req, res) => {
  const code = req.params.id
  if (code) {
    let data = null
    try {
      data = await getProductivity(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} productivity`)
    }
    if (!data) {
      try {
        const stats = await productivityStatsForStudytrack(code, programmeStatsSince)
        data = await setProductivity(stats)
      } catch (e) {
        logger.error(`Failed to update code ${code} patching status to recalculation erroring`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/productivity/recalculate', async (req, res) => {
  const code = req.query.code

  await patchThroughput({ [code]: { status: 'RECALCULATING' } })
  res.status(200).end()

  try {
    if (code.includes('MH') || code.includes('KH')) {
      const data = await productivityStatsForStudytrack(code, new Date('2017-07-31'))
      await setProductivity(data)
    } else {
      const data = await productivityStatsForStudytrack(code, new Date('2000-07-31'))
      await setProductivity(data)
    }
  } catch (e) {
    try {
      await patchProductivity({
        [code]: { status: 'RECALCULATION ERRORED' },
      })
    } catch (e) {
      logger.error(`Failed to update code ${code} patching status to recalculation erroring`)
      return
    }

    logger.error(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
  }
  logger.info(`Produdtiviy stats recalculation for studyprogramme ${code} done`)
})

router.get('/v2/studyprogrammes/:id/throughput', async (req, res) => {
  const code = req.params.id
  if (code) {
    const thesisPromise = findProgrammeTheses(req.params.id)

    let data = null
    try {
      data = await getThroughput(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} throughput`)
    }
    if (!data) {
      try {
        const result = await throughputStatsForStudytrack(req.params.id, programmeStatsSince.getFullYear())
        data = await setThroughput(result)
      } catch (e) {
        logger.error(`Failed to update code ${code} patching status to recalculation erroring`)
      }
    }
    return res.json({ ...data, thesis: await thesisPromise })
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/throughput/recalculate', async (req, res) => {
  const code = req.query.code

  await patchThroughput({ [code]: { status: 'RECALCULATING' } })
  res.status(200).end()

  try {
    if (code.includes('MH') || code.includes('KH')) {
      const data = await throughputStatsForStudytrack(code, 2017)
      await setThroughput(data)
    } else {
      const data = await throughputStatsForStudytrack(code, 2000)
      await setThroughput(data)
    }
  } catch (e) {
    try {
      await patchThroughput({ [code]: { status: 'RECALCULATION ERRORED' } })
    } catch (e) {
      logger.error(`Failed to update code ${code} patching status to recalculation erroring`)
      return
    }
    logger.error(`Failed to update throughput stats for code: ${code}, reason: ${e.message}`)
  }
  logger.info(`Throughput stats recalculation for studyprogramme ${code} done`)
})

router.get('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  if (id) {
    const thesis = await findProgrammeTheses(id)
    res.json(thesis)
  } else {
    res.status(422).end()
  }
})

router.post('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  const { course, thesisType } = req.body
  if (id && course && thesisType) {
    const thesis = await createThesisCourse(id, course, thesisType)
    res.status(201).json(thesis)
  } else {
    res.status(422).end()
  }
})

router.delete('/v2/studyprogrammes/:id/thesis/:course', async (req, res) => {
  const { id, course } = req.params
  if (id && course) {
    const deleted = await deleteThesisCourse(id, course)
    res.status(204).json(deleted)
  } else {
    res.status(422).end()
  }
})

router.use('*', (req, res, next) => next())

module.exports = router
