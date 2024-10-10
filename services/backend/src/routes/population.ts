import * as Sentry from '@sentry/node'
import crypto from 'crypto'
import { Request, Response, Router } from 'express'
import { difference, intersection, uniq } from 'lodash'

import { rootOrgId } from '../config'
import { SISStudyRight } from '../models'
import { maxYearsToCreatePopulationFrom, getCourseProvidersForCourses } from '../services/courses'
import { encrypt, decrypt } from '../services/encrypt'
import { getDegreeProgrammesOfOrganization, ProgrammesOfOrganization } from '../services/faculty/faculty'
import { bottlenecksOf } from '../services/populations/bottlenecksOf'
import { optimizedStatisticsOf } from '../services/populations/optimizedStatisticsOf'
import { populationStudentsMerger, populationCourseStatsMerger } from '../services/statMerger'
import { findByTag, findByCourseAndSemesters } from '../services/students'
import { mapToProviders } from '../shared/util/mapToProviders'
import { GenderCode, ParsedCourse, Unarray, Unification, UnifyStatus } from '../types'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'
import { ApplicationError } from '../util/customErrors'

const router = Router()

const filterPersonalTags = (population: Record<string, any>, userId: string) => {
  return {
    ...population,
    students: population.students.map(student => {
      student.tags = student.tags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
      return student
    }),
  }
}

const isEncryptedStudent = (student?: string | EncryptedStudent) => {
  return (student as EncryptedStudent)?.encryptedData !== undefined
}

type EncryptedStudent = { iv: string; encryptedData: string }

interface PostPopulationStatisticsRequest extends Request {
  body: {
    year: string
    semesters: string[]
    studyRights: string | string[]
    months: number
    selectedStudents: string[] | EncryptedStudent[]
    selectedStudentsByYear?: { [year: string]: string[] }
    studentStatuses?: string[]
    years?: string[]
  }
}

// POST instead of GET because of too long params and "sensitive" data
router.post('/v2/populationstatistics/courses', async (req: PostPopulationStatisticsRequest, res: Response) => {
  if (!req.body.year || !req.body.semesters || !req.body.studyRights) {
    Sentry.captureException(new Error('The body should have a year, semester and study rights defined'))
    return res.status(400).json({ error: 'The body should have a year, semester and study rights defined' })
  }

  if (!Array.isArray(req.body.studyRights)) {
    req.body.studyRights = [req.body.studyRights]
  }

  if (req.body.months == null) {
    req.body.months = 12
  }

  const encrypted = isEncryptedStudent(req.body.selectedStudents[0])

  if (
    !encrypted &&
    !hasFullAccessToStudentData(req.user.roles) &&
    req.body.selectedStudents.some(student => !req.user.studentsUserCanAccess.includes(student))
  ) {
    return res.status(403).json({ error: 'Trying to request unauthorized students data' })
  }

  if (!req.body.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
    return res.status(400).json({ error: 'Semester should be either SPRING OR FALL' })
  }

  if (
    req.body.studentStatuses &&
    !req.body.studentStatuses.every(
      status => status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
    )
  ) {
    return res.status(400).json({ error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' })
  }

  if (req.body.years) {
    const upperYearBound = new Date().getFullYear() + 1
    const multicoursestatPromises = Promise.all(
      req.body.years.map(year => {
        if (req.body.selectedStudentsByYear) {
          req.body.selectedStudents = encrypted
            ? req.body.selectedStudents.filter(isEncryptedStudent).map(decrypt)
            : req.body.selectedStudentsByYear[year]
        }
        const newMonths = (upperYearBound - Number(year)) * 12
        const query = { ...req.body, year, months: newMonths, selectedStudents: req.body.selectedStudents as string[] }
        const coursestatistics = bottlenecksOf(query, null, encrypted)
        return coursestatistics
      })
    )
    const multicoursestats = await multicoursestatPromises
    const result = populationCourseStatsMerger(multicoursestats)
    if (result.error) {
      return res.status(400).json(result)
    }

    return res.json(result)
  }

  if (encrypted) {
    req.body.selectedStudents = req.body.selectedStudents.map(decrypt)
  }

  const query = { ...req.body, selectedStudents: req.body.selectedStudents as string[] }
  try {
    const result = await bottlenecksOf(query, null, encrypted)
    return res.json(result)
  } catch (error: any) {
    Sentry.captureException(new Error(error.message))
    return res.status(400).end()
  }
})

interface PostPopulationStatisticsByTagRequest extends Request {
  body: {
    tag: string
  }
}

router.post(
  '/v2/populationstatistics/coursesbytag',
  async (req: PostPopulationStatisticsByTagRequest, res: Response) => {
    const { roles, studentsUserCanAccess } = req.user
    const { tag } = req.body
    if (!tag) {
      return res.status(400).json({ error: 'The body should have a tag defined' })
    }

    const studentNumbers = await findByTag(tag)
    const studentNumberList = hasFullAccessToStudentData(roles)
      ? studentNumbers
      : intersection(studentNumbers, studentsUserCanAccess)

    try {
      const result = await bottlenecksOf(
        {
          year: '1900',
          studyRights: [],
          semesters: ['FALL', 'SPRING'],
          months: 10000,
          tag,
        },
        studentNumberList
      )
      return res.json(result)
    } catch (error: any) {
      Sentry.captureException(new Error(error.message))
      return res.status(400).end()
    }
  }
)

interface PostPopulationStatisticsByStudentNumberListRequest extends Request {
  body: {
    studentnumberlist: string[]
    year: string
    studyRights: string[]
    semesters: string[]
    months: number
  }
}

router.post(
  '/v2/populationstatistics/coursesbystudentnumberlist',
  async (req: PostPopulationStatisticsByStudentNumberListRequest, res: Response) => {
    const { roles, studentsUserCanAccess } = req.user
    const {
      body: { studentnumberlist, ...query },
    } = req

    if (!studentnumberlist) {
      throw new ApplicationError('The body should have a studentnumberlist defined', 400)
    }

    const studentNumbers = hasFullAccessToStudentData(roles)
      ? studentnumberlist
      : intersection(studentnumberlist, studentsUserCanAccess)

    try {
      const result = await bottlenecksOf(
        {
          year: query?.year ?? 1900,
          studyRights: query?.studyRights ?? [],
          semesters: query?.semesters ?? ['FALL', 'SPRING'],
          months: query?.months ?? 10000,
        },
        studentNumbers
      )
      return res.json(result)
    } catch (error: any) {
      Sentry.captureException(new Error(error.message))
      return res.status(400).end()
    }
  }
)

interface GetPopulationStatisticsRequest extends Request {
  query: {
    year: string
    semesters: string[]
    studyRights: string
    months: string
    years?: string[]
  }
}

router.get('/v3/populationstatistics', async (req: GetPopulationStatisticsRequest, res: Response) => {
  const { year, semesters, studyRights: studyRightsJSON } = req.query
  const { roles, programmeRights, id: userId } = req.user
  if (!year || !semesters || !studyRightsJSON) {
    res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
    return
  }

  const studyRights: { programme: string; combinedProgramme: string } = JSON.parse(studyRightsJSON)

  const fullProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeRightsCodes = programmeRights.map(({ code }) => code)

  try {
    if (
      !hasFullAccessToStudentData(roles) &&
      !programmeRightsCodes.includes(studyRights.programme) &&
      !programmeRightsCodes.includes(studyRights.combinedProgramme)
    ) {
      return res.status(403).json([])
    }
  } catch (error) {
    return res.status(400).json({ error: 'The query had invalid studyRights' })
  }

  if (req.query.months === null) {
    req.query.months = '12'
  }

  if (req.query.years) {
    const upperYearBound = new Date().getFullYear() + 1
    const multipopulationstudentPromises = Promise.all(
      req.query.years.map(year => {
        const newMonths = (upperYearBound - Number(year)) * 12
        const populationStudents = optimizedStatisticsOf({
          ...req.query,
          year: Number(year),
          studyRights: { programme: studyRights.programme },
          months: newMonths,
        })
        return populationStudents
      })
    )
    const multipopulationstudents = await multipopulationstudentPromises

    const result = populationStudentsMerger(multipopulationstudents)

    res.json(filterPersonalTags(result, userId))
  } else {
    const result: any = await optimizedStatisticsOf({
      ...req.query,
      year: Number(req.query.year),
      studyRights: { programme: studyRights.programme },
      months: Number(req.query.months),
    })

    if ('error' in result && result.error) {
      Sentry.captureException(new Error(result.error))
      return res.status(400).end()
    }

    // Obfuscate if user has only limited study programme rights
    if (
      !hasFullAccessToStudentData(roles) &&
      !fullProgrammeRights.includes(studyRights.programme) &&
      !fullProgrammeRights.includes(studyRights.combinedProgramme)
    ) {
      if (!('students' in result)) {
        return
      }
      result.students = result.students.map(student => {
        const { iv, encryptedData: studentNumber } = encrypt(student.studentNumber)
        const obfuscatedBirthDate = new Date(Date.UTC(new Date(student.birthdate).getUTCFullYear(), 0, 1)) // correct year for age distribution calculation but the date is always January 1st
        return {
          ...student,
          firstnames: '',
          lastname: '',
          phoneNumber: '',
          iv,
          studentNumber,
          name: '',
          email: '',
          secondaryEmail: '',
          sis_person_id: '',
          enrollments: student.enrollments?.map(enrollment => ({ ...enrollment, studentnumber: studentNumber })),
          tags: [],
          birthdate: obfuscatedBirthDate,
          obfuscated: true,
        }
      })
    }

    res.json(filterPersonalTags(result, userId))
  }
})

interface GetPopulationStatisticsByCourseRequest extends Request {
  query: {
    coursecodes: string
    from: string
    to: string
    separate: string
    unifyCourses: UnifyStatus
  }
}

router.get('/v3/populationstatisticsbycourse', async (req: GetPopulationStatisticsByCourseRequest, res: Response) => {
  const { coursecodes, from, to, separate: separateString, unifyCourses } = req.query
  const { id, roles, studentsUserCanAccess: allStudentsUserCanAccess, programmeRights } = req.user

  if (!coursecodes || !from || !to) {
    return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
  }

  const maxYearsForPopulation = await maxYearsToCreatePopulationFrom(JSON.parse(coursecodes), Unification.REGULAR)
  const toFromDiff = Math.abs(Number(to) - Number(from) + 1)
  const separate = separateString === 'true'
  const requestedYearsToCreatePopulationFrom = Math.ceil(separate ? toFromDiff / 2 : toFromDiff) // 2 semesters = 1 year
  if (requestedYearsToCreatePopulationFrom > maxYearsForPopulation) {
    return res.status(400).json({ error: `Max years to create population from is ${maxYearsForPopulation}` })
  }

  const studentNumbers = await findByCourseAndSemesters(
    JSON.parse(coursecodes),
    Number(from),
    Number(to),
    separate,
    unifyCourses
  )
  const result: any = await optimizedStatisticsOf(
    {
      // Useless, because studentnumbers are already filtered above by from & to.
      // We should probably refactor this to avoid more confusement.
      year: 1900,
      studyRights: [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
    },
    studentNumbers
  )
  let courseProviders: string[] = []
  if (!hasFullAccessToStudentData(roles)) {
    courseProviders = await getCourseProvidersForCourses(JSON.parse(coursecodes))
  }
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const rightsMappedToProviders = mapToProviders(fullStudyProgrammeRights)
  // does this do the right thing here? this below checks for _some_ right, but does it not then give _all_ rights?
  // compare with usage in teachers.ts where "every" is implemented
  // but can we change the logic all together? What we want to know is whether the user has rights
  // to see these courses, in some meaningful way that "rights" can be linked between a course and a study program
  const found = courseProviders.some(provider => rightsMappedToProviders.includes(provider))

  const studentsUserCanAccess =
    hasFullAccessToStudentData(roles) || found
      ? new Set(studentNumbers)
      : new Set(intersection(studentNumbers, allStudentsUserCanAccess))

  const randomHash = crypto.randomBytes(12).toString('hex')
  const obfuscateStudent = ({
    studyRights,
    studentNumber,
    courses,
    gender_code,
  }: {
    studyRights: SISStudyRight[]
    studentNumber: string
    courses: ParsedCourse[]
    gender_code: GenderCode
  }) => ({
    courses,
    studyRights,
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

  if ('error' in result && result.error) {
    Sentry.captureException(new Error(result.error))
    return res.status(400).end()
  }

  if ('students' in result) {
    result.students = result.students.map(student =>
      studentsUserCanAccess.has(student.studentNumber) ? student : obfuscateStudent(student)
    )
  }

  res.json(filterPersonalTags(result, id))
})

interface PostByStudentNumbersRequest extends Request {
  body: {
    studentnumberlist: string[]
    tags?: {
      studyProgramme: string | null
      year: string | null
    }
  }
}

router.post('/v3/populationstatisticsbystudentnumbers', async (req: PostByStudentNumbersRequest, res: Response) => {
  const { studentnumberlist, tags } = req.body
  const { roles, id, studentsUserCanAccess } = req.user
  const filteredStudentNumbers = hasFullAccessToStudentData(roles)
    ? studentnumberlist
    : intersection(studentnumberlist, studentsUserCanAccess)
  const studyProgrammeCode =
    tags?.studyProgramme && tags?.studyProgramme.includes('+')
      ? tags?.studyProgramme.split('+')[0]
      : tags?.studyProgramme

  const result = await optimizedStatisticsOf(
    {
      year: tags?.year ? Number(tags.year) : 1900,
      studyRights: studyProgrammeCode ? [studyProgrammeCode] : [],
      semesters: ['FALL', 'SPRING'],
      months: 10000,
    },
    filteredStudentNumbers
  )
  if ('error' in result && result.error) {
    Sentry.captureException(new Error(result.error))
    return res.status(500).json({ error: result.error })
  }

  const resultWithStudyProgramme = { ...result, studyProgramme: tags?.studyProgramme }
  const discardedStudentNumbers = difference(studentnumberlist, filteredStudentNumbers)

  res.status(200).json({ ...filterPersonalTags(resultWithStudyProgramme, id), discardedStudentNumbers })
})

router.get('/v3/populationstatistics/studyprogrammes', async (req: Request, res: Response) => {
  const { roles, programmeRights } = req.user
  const programmes = await getDegreeProgrammesOfOrganization(rootOrgId, false)
  const allRights = uniq(programmeRights.map(programme => programme.code))
  if (allRights.includes('KH90_001') || allRights.includes('MH90_001')) {
    allRights.push('KH90_001', 'MH90_001')
  }
  const filteredProgrammes = hasFullAccessToStudentData(roles)
    ? programmes
    : programmes.filter(programme => allRights.includes(programme.code))
  const formattedProgrammes = filteredProgrammes.reduce<Record<string, Unarray<ProgrammesOfOrganization>>>(
    (acc, curr) => {
      acc[curr.code] = curr
      return acc
    },
    {}
  )
  res.json(formattedProgrammes)
})

interface GetMaxYearsRequest extends Request {
  query: {
    courseCodes: string
  }
}

router.get(
  '/v3/populationstatistics/maxYearsToCreatePopulationFrom',
  async (req: GetMaxYearsRequest, res: Response) => {
    const courseCodes = JSON.parse(req.query.courseCodes) as string[]
    const maxYearsToCreatePopulationFromOpen = await maxYearsToCreatePopulationFrom(courseCodes, Unification.OPEN)
    const maxYearsToCreatePopulationFromUni = await maxYearsToCreatePopulationFrom(courseCodes, Unification.REGULAR)
    const maxYearsToCreatePopulationFromBoth = await maxYearsToCreatePopulationFrom(courseCodes, Unification.UNIFY)
    return res.json({
      openCourses: maxYearsToCreatePopulationFromOpen,
      uniCourses: maxYearsToCreatePopulationFromUni,
      unifyCourses: maxYearsToCreatePopulationFromBoth,
    })
  }
)

export default router
