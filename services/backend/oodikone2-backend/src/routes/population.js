const router = require('express').Router()
const Population = require('../services/populations')
const Filters = require('../services/filters')
const { updateStudents } = require('../services/updaterService')
const { isValidStudentId } = require('../util/index')

const Student = require('../services/students')
const StudyrightService = require('../services/studyrights')
const UserService = require('../services/userService')
const TagService = require('../services/tags')
const CourseService = require('../services/courses')

// POST instead of GET because of too long params and "sensitive" data
router.post('/v2/populationstatistics/courses', async (req, res) => {
  try {
    if (!req.body.startYear || !req.body.semesters || !req.body.studyRights) {
      res.status(400).json({ error: 'The body should have a year, semester and study rights defined' })
      return
    }
    if (!Array.isArray(req.body.studyRights)) {
      // studyRights should always be an array
      req.body.studyRights = [req.body.studyRights]
    }

    if (req.body.months == null) {
      req.body.months = 12
    }
    const result = await Population.bottlenecksOf(req.body)

    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.post('/v2/populationstatistics/coursesbycoursecode', async (req, res) => {
  try {
    const { from, to, coursecodes } = req.body
    if (!from || !to || !coursecodes) {
      return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
    }
    const maxYearsToCreatePopulationFrom = await CourseService.maxYearsToCreatePopulationFrom(coursecodes)
    if (Math.abs(to - from) > maxYearsToCreatePopulationFrom) {
      return res.status(400).json({ error: `Max years to create population from is ${maxYearsToCreatePopulationFrom}` })
    }
    let studentnumberlist
    const studentnumbers = await Student.findByCourseAndSemesters(coursecodes, from, to)
    const {
      decodedToken: { userId },
      roles
    } = req

    if (roles && roles.includes('admin')) {
      studentnumberlist = studentnumbers
    } else {
      const unitsUserCanAccess = await UserService.getUnitsFromElementDetails(userId)
      const codes = unitsUserCanAccess.map(unit => unit.id)
      studentnumberlist = await Student.filterStudentnumbersByAccessrights(studentnumbers, codes)
    }

    const result = await Population.bottlenecksOf(
      {
        startYear: 1900,
        endYear: 2200,
        studyRights: [],
        semesters: ['FALL', 'SPRING'],
        months: 10000
      },
      studentnumberlist
    )

    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.post('/v2/populationstatistics/coursesbytag', async (req, res) => {
  try {
    const { tag } = req.body
    if (!tag) {
      res.status(400).json({ error: 'The body should have a tag defined' })
      return
    }
    let studentnumberlist
    const studentnumbers = await Student.findByTag(tag)
    const {
      decodedToken: { userId },
      roles
    } = req
    if (roles && roles.includes('admin')) {
      studentnumberlist = studentnumbers
    } else {
      const unitsUserCanAccess = await UserService.getUnitsFromElementDetails(userId)
      const codes = unitsUserCanAccess.map(unit => unit.id)
      studentnumberlist = await Student.filterStudentnumbersByAccessrights(studentnumbers, codes)
    }
    const result = await Population.bottlenecksOf(
      {
        startYear: 1900,
        endYear: 2200,
        studyRights: [],
        semesters: ['FALL', 'SPRING'],
        months: 10000,
        tag
      },
      studentnumberlist
    )

    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.post('/v2/populationstatistics/coursesbystudentnumberlist', async (req, res) => {
  try {
    if (!req.body.studentnumberlist) {
      res.status(400).json({ error: 'The body should have a studentnumberlist defined' })
      return
    }
    let studentnumberlist
    const {
      decodedToken: { userId },
      roles
    } = req

    if (roles && roles.includes('admin')) {
      studentnumberlist = req.body.studentnumberlist
    } else {
      const unitsUserCanAccess = await UserService.getUnitsFromElementDetails(userId)
      const codes = unitsUserCanAccess.map(unit => unit.id)
      studentnumberlist = await Student.filterStudentnumbersByAccessrights(req.body.studentnumberlist, codes)
    }

    const result = await Population.bottlenecksOf(
      {
        startYear: 1900,
        endYear: 2200,
        studyRights: [],
        semesters: ['FALL', 'SPRING'],
        months: 10000
      },
      studentnumberlist
    )
    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err })
  }
})

router.get('/v3/populationstatistics', async (req, res) => {
  const { startYear, semesters, studyRights: studyRightsJSON } = req.query
  try {
    if (!startYear || !semesters || !studyRightsJSON) {
      res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
      return
    }
    let studyRights = null
    try {
      studyRights = JSON.parse(studyRightsJSON)
      const { rights, roles } = req

      if (!roles || !roles.includes('admin')) {
        if (!rights.includes(studyRights.programme)) {
          res.status(403).json([])
          return
        }
      }
    } catch (e) {
      console.error(e)
      res.status(400).json({ error: 'The query had invalid studyRights' })
      return
    }

    if (req.query.months == null) {
      req.query.months = 12
    }
    const result = await Population.optimizedStatisticsOf({ ...req.query, studyRights })

    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.get('/v3/populationstatisticsbytag', async (req, res) => {
  const { tag, studyRights: studyRightsJSON } = req.query

  if (!tag) return res.status(400).json({ error: 'The query should have a tag defined' })
  const foundTag = await TagService.findTagById(tag)
  if (!foundTag) return res.status(404).json({ error: 'Tag not found' })

  const semesters = ['FALL', 'SPRING']
  let studentnumberlist
  const studentnumbers = await Student.findByTag(tag)
  const {
    decodedToken: { userId },
    roles
  } = req
  if (roles && roles.includes('admin')) {
    studentnumberlist = studentnumbers
  } else {
    const unitsUserCanAccess = await UserService.getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    studentnumberlist = await Student.filterStudentnumbersByAccessrights(studentnumbers, codes)
  }
  try {
    const studyRights = JSON.parse(studyRightsJSON)
    const newStartYear = await Population.getEarliestYear(studentnumberlist, studyRights)
    const result = await Population.optimizedStatisticsOf(
      {
        startYear: newStartYear,
        endYear: 2200,
        studyRights,
        semesters,
        months: 10000,
        tag: foundTag
      },
      studentnumberlist
    )

    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.get('/v3/populationstatisticsbycourse', async (req, res) => {
  const { coursecodes, from, to } = req.query

  if (!coursecodes || !from || !to) {
    return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
  }

  const maxYearsToCreatePopulationFrom = await CourseService.maxYearsToCreatePopulationFrom(JSON.parse(coursecodes))
  if (Math.abs(to - from) > maxYearsToCreatePopulationFrom) {
    return res.status(400).json({ error: `Max years to create population from is ${maxYearsToCreatePopulationFrom}` })
  }
  const semesters = ['FALL', 'SPRING']
  let studentnumberlist
  const studentnumbers = await Student.findByCourseAndSemesters(JSON.parse(coursecodes), from, to)
  const {
    decodedToken: { userId },
    roles
  } = req

  if (roles && roles.includes('admin')) {
    studentnumberlist = studentnumbers
  } else {
    const unitsUserCanAccess = await UserService.getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    studentnumberlist = await Student.filterStudentnumbersByAccessrights(studentnumbers, codes)
  }
  try {
    const result = await Population.optimizedStatisticsOf(
      {
        startYear: 1900,
        endYear: 2200,
        studyRights: [],
        semesters,
        months: 10000
      },
      studentnumberlist
    )

    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e })
  }
})

router.post('/v3/populationstatisticsbystudentnumbers', async (req, res) => {
  const { studentnumberlist } = req.body
  const { roles } = req

  if (!(roles && roles.includes('admin'))) {
    console.log('no rights')
    res.status(400).end()
    return
  } else {
    try {
      const result = await Population.optimizedStatisticsOf(
        {
          startYear: 1900,
          endYear: 2200,
          studyRights: [],
          semesters: ['FALL', 'SPRING'],
          months: 10000
        },
        studentnumberlist
      )
      if (result.error) {
        console.log(result.error)
        res.status(400).end()
        return
      }
      res.status(200).json(result)
    } catch (err) {
      console.log(err)
      res.status(400).end()
    }
  }
})

router.get('/v2/populationstatistics/filters', async (req, res) => {
  let results = []
  let rights = req.query.studyRights
  if (!Array.isArray(rights)) {
    // studyRights should always be an array
    rights = [rights]
  }
  try {
    results = await Filters.findForPopulation(rights)
    res.status(200).json(results)
  } catch (err) {
    console.log(err)
    res.status(400).end()
  }
})
router.post('/v2/populationstatistics/filters', async (req, res) => {
  let results = []
  const filter = req.body

  try {
    results = await Filters.createNewFilter(filter)
    res.status(200).json(results)
  } catch (err) {
    console.log(err)
    res.status(400).end()
  }
})
router.delete('/v2/populationstatistics/filters', async (req, res) => {
  let results = []
  const filter = req.body
  try {
    results = await Filters.deleteFilter(filter)
    res.status(200).json(results)
  } catch (err) {
    res.status(400).end()
  }
})

router.post('/updatedatabase', async (req, res) => {
  const studentnumbers = req.body
  if (!(studentnumbers && studentnumbers.every(sn => isValidStudentId(sn)))) {
    res.status(400).end()
    return
  }
  try {
    const response = await updateStudents(studentnumbers)
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v3/populationstatistics/studyprogrammes', async (req, res) => {
  try {
    const { rights, roles } = req
    if (roles && roles.includes('admin')) {
      const studyrights = await StudyrightService.getAssociations()
      res.json(studyrights)
    } else {
      const studyrights = await StudyrightService.getFilteredAssociations(rights)
      res.json(studyrights)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v3/populationstatistics/studyprogrammes/unfiltered', async (req, res) => {
  try {
    const studyrights = await StudyrightService.getAssociations()
    res.json(studyrights)
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v3/populationstatistics/maxYearsToCreatePopulationFrom', async (req, res) => {
  try {
    const { courseCodes } = req.query
    const maxYearsToCreatePopulationFrom = await CourseService.maxYearsToCreatePopulationFrom(JSON.parse(courseCodes))
    return res.json(maxYearsToCreatePopulationFrom)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router
