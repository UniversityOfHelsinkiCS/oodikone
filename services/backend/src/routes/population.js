const crypto = require('crypto')
const Sentry = require('@sentry/node')
const router = require('express').Router()
const _ = require('lodash')
const Population = require('../services/populations')
const Student = require('../services/students')
const StudyrightService = require('../services/studyrights')
const TagService = require('../services/tags')
const CourseService = require('../services/courses')
const StatMergeService = require('../services/statMerger')
const { mapToProviders } = require('../util/utils')
const { encrypt, decrypt } = require('../services/encrypt')
const { mapCodesToIds } = require('../services/studyprogrammeHelpers')

const { ApplicationError } = require('../util/customErrors')

const filterPersonalTags = (population, userId) => {
  return {
    ...population,
    students: population.students.map(student => {
      student.tags = student.tags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
      return student
    }),
  }
}

// POST instead of GET because of too long params and "sensitive" data
router.post('/v2/populationstatistics/courses', async (req, res) => {
  if (!req.body.year || !req.body.semesters || !req.body.studyRights) {
    Sentry.captureException(new Error('The body should have a year, semester and study rights defined'))
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

  const encrypted = req.body.selectedStudents[0]?.encryptedData

  if (req.body.years) {
    const upperYearBound = new Date().getFullYear() + 1
    const multicoursestatPromises = Promise.all(
      req.body.years.map(year => {
        if (req.body.selectedStudentsByYear) {
          req.body.selectedStudents = encrypted
            ? req.body.selectedStudents
                .filter(
                  ({ encryptedData }) =>
                    req.body.selectedStudentsByYear[year] &&
                    req.body.selectedStudentsByYear[year].includes(encryptedData)
                )
                .map(decrypt)
            : req.body.selectedStudentsByYear[year]
        }
        const newMonths = (upperYearBound - Number(year)) * 12
        const query = { ...req.body, year, months: newMonths }
        const coursestatistics = Population.bottlenecksOf(query, null, encrypted)
        return coursestatistics
      })
    )
    const multicoursestats = await multicoursestatPromises
    const result = StatMergeService.populationCourseStatsMerger(multicoursestats)
    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } else {
    if (encrypted) req.body.selectedStudents = req.body.selectedStudents.map(decrypt)

    const result = await Population.bottlenecksOf(req.body, null, encrypted)

    if (result.error) {
      Sentry.captureException(new Error(result.error))
      res.status(400).json(result)
      return
    }

    res.json(result)
  }
})

router.post('/v2/populationstatistics/coursesbycoursecode', async (req, res) => {
  const { from, to, coursecodes } = req.body
  if (!from || !to || !coursecodes) {
    return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
  }
  const maxYearsToCreatePopulationFrom = await CourseService.maxYearsToCreatePopulationFrom(coursecodes)
  if (Math.abs(to - from + 1) > maxYearsToCreatePopulationFrom) {
    return res.status(400).json({ error: `Max years to create population from is ${maxYearsToCreatePopulationFrom}` })
  }

  const {
    user: { isAdmin, studentsUserCanAccess },
  } = req

  const studentnumbers = await Student.findByCourseAndSemesters(coursecodes, from, to)
  const studentnumberlist = isAdmin ? studentnumbers : _.intersection(studentnumbers, studentsUserCanAccess)

  const result = await Population.bottlenecksOf(
    {
      year: 1900,
      studyRights: [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
    },
    studentnumberlist
  )

  if (result.error) {
    Sentry.captureException(new Error(result.error))
    res.status(400).json(result)
    return
  }

  res.json(result)
})

router.post('/v2/populationstatistics/coursesbytag', async (req, res) => {
  const { tag } = req.body
  if (!tag) {
    res.status(400).json({ error: 'The body should have a tag defined' })
    return
  }
  const {
    user: { isAdmin, studentsUserCanAccess },
  } = req
  const studentnumbers = await Student.findByTag(tag)
  const studentnumberlist = isAdmin ? studentnumbers : _.intersection(studentnumbers, studentsUserCanAccess)

  const result = await Population.bottlenecksOf(
    {
      year: 1900,
      studyRights: [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
      tag,
    },
    studentnumberlist
  )

  if (result.error) {
    Sentry.captureException(new Error(result.error))
    res.status(400).end()
    return
  }

  res.json(result)
})

router.post('/v2/populationstatistics/coursesbystudentnumberlist', async (req, res) => {
  const {
    user: { isAdmin, studentsUserCanAccess },
    body: { studentnumberlist: studentnumbersInReq, studentCountLimit, ...query },
  } = req

  if (!studentnumbersInReq) {
    throw new ApplicationError('The body should have a studentnumberlist defined', 400)
  }

  const studentnumberlist = isAdmin ? studentnumbersInReq : _.intersection(studentnumbersInReq, studentsUserCanAccess)

  const result = await Population.bottlenecksOf(
    {
      year: query?.year ?? 1900,
      studyRights: query?.studyRights ?? [],
      semesters: query?.semesters ?? ['FALL', 'SPRING'],
      months: query?.months ?? 10000,
      studentCountLimit,
    },
    studentnumberlist
  )
  if (result.error) {
    Sentry.captureException(new Error(result.error))
    res.status(400).json(result)
    return
  }

  res.json(result)
})

router.get('/v3/populationstatistics', async (req, res) => {
  const { year, semesters, studyRights: studyRightsJSON } = req.query
  const { user } = req

  if (!year || !semesters || !studyRightsJSON) {
    res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
    return
  }
  let studyRights = null
  studyRights = JSON.parse(studyRightsJSON)
  const {
    user: { rights, iamRights, isAdmin },
  } = req

  try {
    if (!isAdmin && !rights.includes(studyRights.programme) && !iamRights.includes(studyRights.programme)) {
      res.status(403).json([])
      return
    }
  } catch (e) {
    res.status(400).json({ error: 'The query had invalid studyRights' })
    return
  }

  if (req.query.months == null) {
    req.query.months = 12
  }

  if (req.query.years) {
    const upperYearBound = new Date().getFullYear() + 1
    const multipopulationstudentPromises = Promise.all(
      req.query.years.map(year => {
        const newMonths = (upperYearBound - Number(year)) * 12
        const populationStudents = Population.optimizedStatisticsOf({
          ...req.query,
          studyRights,
          year,
          months: newMonths,
        })
        return populationStudents
      })
    )
    const multipopulationstudents = await multipopulationstudentPromises

    const result = StatMergeService.populationStudentsMerger(multipopulationstudents)

    if (result.error) {
      Sentry.captureException(new Error(result.error))
      res.status(400).end()
      return
    }

    res.json(filterPersonalTags(result, user.id))
  } else {
    const result = await Population.optimizedStatisticsOf({ ...req.query, studyRights })
    if (result.error) {
      Sentry.captureException(new Error(result.error))
      res.status(400).end()
      return
    }

    // Obfuscate if user has only iam rights
    if (!isAdmin && !rights.includes(studyRights.programme)) {
      result.students = result.students.map(student => {
        const { iv, encryptedData } = encrypt(student.studentNumber)
        const obfuscatedBirthDate = new Date(new Date(student.birthdate).setMonth(0, 0)) // only birth year for age distribution
        return {
          ...student,
          firstnames: '',
          lastname: '',
          phone_number: '',
          started: null,
          iv,
          studentNumber: encryptedData,
          name: '',
          email: '',
          tags: [],
          birthdate: obfuscatedBirthDate,
          obfuscated: true,
        }
      })
    }

    res.json(filterPersonalTags(result, user.id))
  }
})

router.get('/v3/populationstatisticsbytag', async (req, res) => {
  const {
    user: { id, isAdmin, studentsUserCanAccess },
    query: { tag, studyRights: studyRightsJSON, months, year },
  } = req

  if (!tag) return res.status(400).json({ error: 'The query should have a tag defined' })
  const foundTag = await TagService.findTagById(tag)
  if (!foundTag) return res.status(404).json({ error: 'Tag not found' })

  const semesters = ['FALL', 'SPRING']

  const studentnumbers = await Student.findByTag(tag)

  const studentnumberlist = isAdmin ? studentnumbers : _.intersection(studentnumbers, studentsUserCanAccess)

  const studyRights = JSON.parse(studyRightsJSON)
  const newStartYear = await Population.getEarliestYear(studentnumberlist, studyRights)
  const yearDifference = Number(year) - Number(newStartYear)
  const newMonths = Number(months) + 12 * yearDifference
  const result = await Population.optimizedStatisticsOf(
    {
      year: newStartYear,
      studyRights,
      semesters,
      months: newMonths,
      tag: foundTag,
    },
    studentnumberlist
  )

  if (result.error) {
    Sentry.captureException(new Error(result.error))
    res.status(400).end()
    return
  }

  res.json(filterPersonalTags(result, id))
})

router.get('/v3/populationstatisticsbycourse', async (req, res) => {
  const { coursecodes, from, to, separate: sep, unifyCourses } = req.query
  const {
    user: { id, isAdmin, studentsUserCanAccess: allStudentsUserCanAccess, rights },
  } = req
  const separate = sep ? JSON.parse(sep) : false

  if (!coursecodes || !from || !to) {
    return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
  }

  const maxYearsToCreatePopulationFrom = await CourseService.maxYearsToCreatePopulationFrom(JSON.parse(coursecodes))
  const toFromDiff = Math.abs(to - from + 1)
  // 2 semesters = 1 year
  const requestedYearsToCreatePopulationFrom = Math.ceil(separate ? toFromDiff / 2 : toFromDiff)
  if (requestedYearsToCreatePopulationFrom > maxYearsToCreatePopulationFrom) {
    return res.status(400).json({ error: `Max years to create population from is ${maxYearsToCreatePopulationFrom}` })
  }

  const semesters = ['FALL', 'SPRING']
  const studentnumbers = await Student.findByCourseAndSemesters(
    JSON.parse(coursecodes),
    from,
    to,
    separate,
    unifyCourses
  )
  const result = await Population.optimizedStatisticsOf(
    {
      // Useless, because studentnumbers are already filtered above by from & to.
      // We should probably refactor this to avoid more confusement.
      year: 1900,
      studyRights: [],
      semesters,
      months: 10000,
    },
    studentnumbers
  )
  let courseproviders = []
  if (!isAdmin) {
    courseproviders = await CourseService.getCourseProvidersForCourses(JSON.parse(coursecodes))
  }
  const rightsMappedToProviders = mapToProviders(rights)
  const found = courseproviders.some(r => rightsMappedToProviders.includes(r))

  const studentsUserCanAccess =
    isAdmin || found ? new Set(studentnumbers) : new Set(_.intersection(studentnumbers, allStudentsUserCanAccess))

  const randomHash = crypto.randomBytes(12).toString('hex')
  const obfuscateStudent = ({ studyrights, studentNumber, courses, gender_code }) => ({
    courses,
    studyrights,
    gender_code,
    studentNumber: crypto.createHash('md5').update(`${studentNumber}${randomHash}`).digest('hex'),
    firstnames: '',
    lastname: '',
    phone_number: '',
    name: '',
    email: '',
    started: null,
    credits: '',
    tags: [],
    obfuscated: true,
  })

  result.students = result.students.map(s => (studentsUserCanAccess.has(s.studentNumber) ? s : obfuscateStudent(s)))

  if (result.error) {
    Sentry.captureException(new Error(result.error))
    res.status(400).end()
    return
  }

  res.json(filterPersonalTags(result, id))
})

router.post('/v3/populationstatisticsbystudentnumbers', async (req, res) => {
  const { studentnumberlist } = req.body
  const {
    user: { isAdmin, id, studentsUserCanAccess },
  } = req

  const filteredStudentNumbers = isAdmin ? studentnumberlist : _.intersection(studentnumberlist, studentsUserCanAccess)

  const result = await Population.optimizedStatisticsOf(
    {
      year: 1900,
      studyRights: [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
    },
    filteredStudentNumbers
  )
  if (result.error) {
    Sentry.captureException(new Error(result.error))
    return
  }
  res.status(200).json(filterPersonalTags(result, id))
})

router.get('/v3/populationstatistics/studyprogrammes', async (req, res) => {
  const {
    user: { rights, iamRights, roles },
  } = req
  if (roles?.includes('admin')) {
    const studyrights = await StudyrightService.getAssociations()
    mapCodesToIds(studyrights.programmes)
    res.json(studyrights)
  } else {
    const studyrights = await StudyrightService.getFilteredAssociations(rights.concat(iamRights))
    mapCodesToIds(studyrights.programmes)
    res.json(studyrights)
  }
})

router.get('/v3/populationstatistics/studyprogrammes/unfiltered', async (req, res) => {
  const studyrights = await StudyrightService.getAssociations()
  res.json(studyrights)
})

router.get('/v3/populationstatistics/maxYearsToCreatePopulationFrom', async (req, res) => {
  const { courseCodes } = req.query
  const maxYearsToCreatePopulationFromOpen = await CourseService.maxYearsToCreatePopulationFrom(
    JSON.parse(courseCodes),
    'openStats'
  )
  const maxYearsToCreatePopulationFromUni = await CourseService.maxYearsToCreatePopulationFrom(
    JSON.parse(courseCodes),
    'reqularStats'
  )
  const maxYearsToCreatePopulationFromBoth = await CourseService.maxYearsToCreatePopulationFrom(
    JSON.parse(courseCodes),
    'unifyStats'
  )
  return res.json({
    openCourses: maxYearsToCreatePopulationFromOpen,
    uniCourses: maxYearsToCreatePopulationFromUni,
    unifyCourses: maxYearsToCreatePopulationFromBoth,
  })
})

module.exports = router
