const router = require('express').Router()
const { getStudentsUserCanAccess } = require('../services/userService')
const { getAllDegreesAndProgrammes, getAllProgrammes, getAllElementDetails } = require('../services/studyrights')
const MandatoryCourses = require('../services/mandatoryCourses')
const { productivityStatsForCode, throughputStatsForCode, optionData } = require('../services/studyprogramme')
const { findProgrammeTheses, createThesisCourse, deleteThesisCourse } = require('../services/thesis')
const {
  getProductivity,
  setProductivity,
  getThroughput,
  setThroughput,
  patchProductivity,
  patchThroughput,
  getNonGraduatedStudents,
  ping
} = require('../services/analyticsService')
const elementDetailsV2 = require('../routesV2/elementdetails')
const useSisRouter = require('../util/useSisRouter')

const programmeStatsSince = new Date('2017-07-31')

router.get('/elementdetails/all', async (req, res) => {
  try {
    const elementdetails = await getAllElementDetails()
    res.json(elementdetails)
  } catch (e) {
    res.status(500).json(e)
  }
})

router.get('/studyprogrammes', async (req, res) => {
  try {
    const studyrights = await getAllDegreesAndProgrammes()
    res.json(studyrights)
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v2/studyprogrammes/:id/present_students', async (req, res) => {
  try {
    const {
      roles,
      decodedToken,
      params: { id }
    } = req
    if (!id) return res.status(400).json({ error: 'programme id missing' })

    const nonGraduatedStudents = await getNonGraduatedStudents(id)
    if (!nonGraduatedStudents) return res.status(200).json({})
    const {
      data: { formattedData, studentnumbers }
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

router.get('/v2/studyprogrammes/ping', async (req, res) => {
  try {
    const result = await ping()
    res.json(result)
  } catch (e) {
    res.status(500).end()
  }
})

router.get('/v2/studyprogrammes/:id/optiondata', async (req, res) => {
  const code = req.params.id
  if (code) {
    if (code.includes('MH')) {
      const data = await optionData(new Date('2017-07-31'), new Date(), code, 'MSC')
      return res.json(data)
    } else if (code.includes('KH')) {
      const data = await optionData(new Date('2017-07-31'), new Date(), code, 'BSC')
      return res.json(data)
    } else {
      return res.json([])
    }
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
        const stats = await productivityStatsForCode(code, programmeStatsSince)
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
  const codes = code ? [code] : (await getAllProgrammes()).map(p => p.code)
  try {
    await patchProductivity(
      codes.reduce((acc, c) => {
        acc[c] = { status: 'RECALCULATING' }
        return acc
      }, {})
    )
    res.status(200).end()
  } catch (e) {
    console.error(e)
    return res.status(500).end()
  }

  let ready = 0
  for (const code of codes) {
    try {
      if (code.includes('MH') || code.includes('KH')) {
        const data = await productivityStatsForCode(code, new Date('2017-07-31'))
        await setProductivity(data)
      } else {
        const data = await productivityStatsForCode(code, new Date('2000-07-31'))
        await setProductivity(data)
      }
    } catch (e) {
      try {
        await patchProductivity({
          [code]: { status: 'RECALCULATION ERRORED' }
        })
      } catch (e) {
        console.error(e)
        return
      }
      console.error(e)
      console.log(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
    }
    ready += 1
    console.log(`Productivity stats recalculation ${ready}/${codes.length} done`)
  }
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
        const result = await throughputStatsForCode(req.params.id, programmeStatsSince.getFullYear())
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
  const codes = code ? [code] : (await getAllProgrammes()).map(p => p.code)
  try {
    const data = codes.reduce((acc, id) => ({ ...acc, [id]: { status: 'RECALCULATING' } }), {})
    await patchThroughput(data)
    res.status(200).end()
  } catch (e) {
    console.error(e)
    return res.status(500).end()
  }

  let ready = 0
  for (const code of codes) {
    try {
      if (code.includes('MH') || code.includes('KH')) {
        const data = await throughputStatsForCode(code, 2017)
        await setThroughput(data)
      } else {
        const data = await throughputStatsForCode(code, 2000)
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
    ready += 1
    console.log(`Throughput stats recalculation ${ready}/${codes.length} done`)
  }
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

module.exports = useSisRouter(elementDetailsV2, router)
