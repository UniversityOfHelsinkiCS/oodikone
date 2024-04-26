const crypto = require('crypto')
const Sentry = require('@sentry/node')
const router = require('express').Router()
const _ = require('lodash')
const populationService = require('../services/populations')
const studentService = require('../services/students')
const StudyrightService = require('../services/studyrights')
const CourseService = require('../services/courses')
const StatMergeService = require('../services/statMerger')
const { mapToProviders, getFullStudyProgrammeRights, hasFullAccessToStudentData } = require('../util/utils')
const { encrypt, decrypt } = require('../services/encrypt')
const { mapCodesToIds } = require('../services/studyprogramme/studyprogrammeHelpers')

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
        const coursestatistics = populationService.bottlenecksOf(query, null, encrypted)
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

    const result = await populationService.bottlenecksOf(req.body, null, encrypted)

    if (result.error) {
      Sentry.captureException(new Error(result.error))
      res.status(400).json(result)
      return
    }

    res.json(result)
  }
})

router.post('/v2/populationstatistics/coursesbytag', async (req, res) => {
  const { tag } = req.body
  if (!tag) {
    res.status(400).json({ error: 'The body should have a tag defined' })
    return
  }
  const {
    user: { roles, studentsUserCanAccess },
  } = req
  const studentnumbers = await studentService.findByTag(tag)
  const studentnumberlist = hasFullAccessToStudentData(roles)
    ? studentnumbers
    : _.intersection(studentnumbers, studentsUserCanAccess)

  const result = await populationService.bottlenecksOf(
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
    user: { roles, studentsUserCanAccess },
    body: { studentnumberlist: studentnumbersInReq, ...query },
  } = req

  if (!studentnumbersInReq) {
    throw new ApplicationError('The body should have a studentnumberlist defined', 400)
  }

  const studentnumberlist = hasFullAccessToStudentData(roles)
    ? studentnumbersInReq
    : _.intersection(studentnumbersInReq, studentsUserCanAccess)
  const result = await populationService.bottlenecksOf(
    {
      year: query?.year ?? 1900,
      studyRights: query?.studyRights ?? [],
      semesters: query?.semesters ?? ['FALL', 'SPRING'],
      months: query?.months ?? 10000,
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
  const {
    user: { roles, programmeRights, id: userId },
  } = req

  if (!year || !semesters || !studyRightsJSON) {
    res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
    return
  }
  let studyRights = null
  studyRights = JSON.parse(studyRightsJSON)

  const fullProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeRightsCodes = programmeRights.map(({ code }) => code)

  try {
    if (
      !hasFullAccessToStudentData(roles) &&
      !programmeRightsCodes.includes(studyRights.programme) &&
      !programmeRightsCodes.includes(studyRights.combinedProgramme)
    ) {
      res.status(403).json([])
      return
    }
  } catch (e) {
    res.status(400).json({ error: 'The query had invalid studyRights' })
    return
  }

  if (req.query.months === null) {
    req.query.months = 12
  }

  if (req.query.years) {
    const upperYearBound = new Date().getFullYear() + 1
    const multipopulationstudentPromises = Promise.all(
      req.query.years.map(year => {
        const newMonths = (upperYearBound - Number(year)) * 12
        const populationStudents = populationService.optimizedStatisticsOf(
          {
            ...req.query,
            studyRights: { programme: studyRights.programme },
            year,
            months: newMonths,
          },
          null
        )
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

    res.json(filterPersonalTags(result, userId))
  } else {
    const result = await populationService.optimizedStatisticsOf({
      ...req.query,
      studyRights: { programme: studyRights.programme },
    })

    if (result.error) {
      Sentry.captureException(new Error(result.error))
      res.status(400).end()
      return
    }

    // Obfuscate if user has only limited study programme rights
    if (
      !hasFullAccessToStudentData(roles) &&
      !fullProgrammeRights.includes(studyRights.programme) &&
      !fullProgrammeRights.includes(studyRights.combinedProgramme)
    ) {
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

    res.json(filterPersonalTags(result, userId))
  }
})

router.get('/v3/populationstatisticsbycourse', async (req, res) => {
  const { coursecodes, from, to, separate: sep, unifyCourses } = req.query
  const {
    user: { id, roles, studentsUserCanAccess: allStudentsUserCanAccess, programmeRights },
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
  const studentnumbers = await studentService.findByCourseAndSemesters(
    JSON.parse(coursecodes),
    from,
    to,
    separate,
    unifyCourses
  )
  const result = await populationService.optimizedStatisticsOf(
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
  if (!hasFullAccessToStudentData(roles)) {
    courseproviders = await CourseService.getCourseProvidersForCourses(JSON.parse(coursecodes))
  }
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const rightsMappedToProviders = mapToProviders(fullStudyProgrammeRights)
  const found = courseproviders.some(r => rightsMappedToProviders.includes(r))

  const studentsUserCanAccess =
    hasFullAccessToStudentData(roles) || found
      ? new Set(studentnumbers)
      : new Set(_.intersection(studentnumbers, allStudentsUserCanAccess))

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
  const { studentnumberlist, tags } = req.body
  const {
    user: { roles, id, studentsUserCanAccess },
  } = req
  const filteredStudentNumbers = hasFullAccessToStudentData(roles)
    ? studentnumberlist
    : _.intersection(studentnumberlist, studentsUserCanAccess)

  const studyProgrammeCode =
    tags?.studyProgramme && tags?.studyProgramme.includes('+')
      ? tags?.studyProgramme.split('+')[0]
      : tags?.studyProgramme
  const result = await populationService.optimizedStatisticsOf(
    {
      year: tags?.year || 1900,
      studyRights: studyProgrammeCode ? [studyProgrammeCode] : [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
    },
    filteredStudentNumbers
  )
  if (result.error) {
    Sentry.captureException(new Error(result.error))
    return
  }

  result.studyProgramme = tags?.studyProgramme

  const discardedStudentNumbers = _.difference(studentnumberlist, filteredStudentNumbers)

  res.status(200).json({ ...filterPersonalTags(result, id), discardedStudentNumbers })
})

router.get('/v3/populationstatistics/studyprogrammes', async (req, res) => {
  const {
    user: { roles, programmeRights },
  } = req
  if (hasFullAccessToStudentData(roles)) {
    const studyrights = await StudyrightService.getAssociations()
    mapCodesToIds(studyrights.programmes)
    res.json(studyrights)
  } else {
    const allRights = _.uniq(programmeRights.map(p => p.code))
    // For combined programme
    // If more programmes are combined, then a function might be a better idea to add moar rights
    if (allRights.includes('KH90_001') || allRights.includes('MH90_001')) allRights.push('KH90_001', 'MH90_001')
    const studyrights = await StudyrightService.getFilteredAssociations(allRights)
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
    'regularStats'
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
