const router = require('express').Router()
const { getStudentsUserCanAccess } = require('../services/userService')
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
  getNonGraduatedStudents,
} = require('../services/analyticsService')

const programmeStatsSince = new Date('2017-07-31')

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

router.get('/v2/studyprogrammes/:id/present_students', async (req, res) => {
  try {
    const {
      roles,
      decodedToken,
      params: { id },
    } = req
    if (!id) return res.status(400).json({ error: 'programme id missing' })

    const nonGraduatedStudents = await getNonGraduatedStudents(id)
    if (!nonGraduatedStudents) return res.status(200).json({})
    const {
      data: { formattedData, studentnumbers },
    } = nonGraduatedStudents

    const filteredData = { ...formattedData }
    const studentsUserCanAccess = await getStudentsUserCanAccess(studentnumbers, roles, decodedToken.userId)
    Object.keys(filteredData).forEach(year => {
      filteredData[year] = filteredData[year].filter(({ studentNumber }) => studentsUserCanAccess.has(studentNumber))
    })

    res.json(filteredData)
  } catch (e) {
    console.error('e', e)
    res.status(500).json({ error: 'error' })
  }
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
      console.error(e)
    }
    if (!data) {
      try {
        const stats = await productivityStatsForStudytrack(code, programmeStatsSince)
        data = await setProductivity(stats)
      } catch (e) {
        console.error(e)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/productivity/recalculate', async (req, res) => {
  const code = req.query.code

  console.log('Productivity stats recalculation starting')
  try {
    await patchThroughput({ [code]: { status: 'RECALCULATING' } })
    res.status(200).end()
  } catch (e) {
    console.error(e)
    return res.status(500).end()
  }

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
      console.error(e)
      return
    }
    console.error(e)
    console.log(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
  }
  console.log(`Productivity stats recalculation for studyprogramme ${code} done`)
})

router.get('/v2/studyprogrammes/:id/throughput', async (req, res) => {
  const code = req.params.id
  if (code) {
    const thesisPromise = findProgrammeTheses(req.params.id)

    let data = null
    try {
      data = await getThroughput(code)
    } catch (e) {
      console.error(e)
    }
    if (!data) {
      try {
        const result = await throughputStatsForStudytrack(req.params.id, programmeStatsSince.getFullYear())
        data = await setThroughput(result)
      } catch (e) {
        console.error(e)
      }
    }
    return res.json({ ...data, thesis: await thesisPromise })
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/throughput/recalculate', async (req, res) => {
  const code = req.query.code

  console.log('Throughput stats recalculation starting')
  try {
    await patchThroughput({ [code]: { status: 'RECALCULATING' } })
    res.status(200).end()
  } catch (e) {
    console.error(e)
    return res.status(500).end()
  }

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
      console.error(e)
      return
    }
    console.error(e)
    console.log(`Failed to update throughput stats for code: ${code}, reason: ${e.message}`)
  }
  console.log(`Throughput stats recalculation for studyprogramme ${code} done`)
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
