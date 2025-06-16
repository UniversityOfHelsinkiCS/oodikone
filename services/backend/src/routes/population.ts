import * as Sentry from '@sentry/node'
import crypto from 'crypto'
import { Request, Response, Router } from 'express'
import { difference, intersection, uniq } from 'lodash'

import { CanError } from '@oodikone/shared/routes'
import {
  PopulationstatisticsCoursesResBody,
  PopulationstatisticsCoursesReqBody,
} from '@oodikone/shared/routes/populations'
import { GenderCode, EncrypterData as EncryptedStudent } from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { rootOrgId } from '../config'
import { SISStudyRightModel } from '../models'
import { maxYearsToCreatePopulationFrom, getCourseProvidersForCourses } from '../services/courses'
import { encrypt } from '../services/encrypt'
import { getDegreeProgrammesOfOrganization, ProgrammesOfOrganization } from '../services/faculty/faculty'
import { bottlenecksOf } from '../services/populations/bottlenecksOf'
import { optimizedStatisticsOf } from '../services/populations/optimizedStatisticsOf'
import { findByCourseAndSemesters } from '../services/students'
import { ParsedCourse, Unarray, Unification, UnifyStatus } from '../types'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData, safeJSONParse } from '../util'

const router = Router()

const isEncryptedStudent = (student?: string | EncryptedStudent) => {
  return (student as EncryptedStudent)?.encryptedData !== undefined
}

// NOTE: POST instead of GET because of too long params and "sensitive" data
router.post<never, CanError<PopulationstatisticsCoursesResBody>, PopulationstatisticsCoursesReqBody>(
  '/v4/populationstatistics/courses',
  async (req, res) => {
    const { roles, studentsUserCanAccess } = req.user
    const { selectedStudents, courses: selectedCourses = [], selectedStudentsByYear = {} } = req.body

    const hasFullAccess = hasFullAccessToStudentData(roles)

    const isEncrypted = selectedStudents.some(isEncryptedStudent)
    if (isEncrypted && !selectedStudents.every(isEncryptedStudent)) {
      Sentry.captureException(new Error('Trying to request unencrypted student data as encrypted'))
      return res.status(403).json({ error: 'Trying to request unauthorized student data' })
    }

    const hasAccessToStudents =
      isEncrypted || (selectedStudents as string[]).every(student => studentsUserCanAccess.includes(student))

    if (!hasAccessToStudents && !hasFullAccess) {
      return res.status(403).json({ error: 'Trying to request unauthorized students data' })
    }

    const requiredFields = [selectedStudents, selectedCourses]
    if (requiredFields.some(field => !field)) {
      Sentry.captureException(new Error('The request body should countain: selected students and courses'))
      return res.status(400).json({ error: 'The request body should countain: selected students and courses' })
    }

    return res.json(
      await bottlenecksOf(selectedStudents as string[], selectedStudentsByYear, selectedCourses, isEncrypted)
    )
  }
)

export type PopulationstatisticsResBody = CanError<{ students: any }>
export type PopulationstatisticsReqBody = never
export type PopulationstatisticsQuery = {
  semesters: string[]
  studentStatuses?: string[]
  // NOTE: This param is a JSON -object
  studyRights: string
  year: string
  months?: string
  years?: string[]
}

router.get<never, PopulationstatisticsResBody, PopulationstatisticsReqBody, PopulationstatisticsQuery>(
  '/v3/populationstatistics',
  async (req, res) => {
    const { id: userId, roles: userRoles, programmeRights: userProgrammeRights } = req.user
    const { year, semesters, studyRights: requestedStudyRightsJSON, studentStatuses } = req.query

    const months = req.query.months ?? '12'

    // NOTE: `year` isn't needed anymore if `years` is defined
    const requiredFields = [year, semesters, requestedStudyRightsJSON]
    if (requiredFields.some(field => !field)) {
      return res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
    }

    if (!semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
      return res.status(400).json({ error: 'Semester should be either SPRING OR FALL' })
    }

    const hasCorrectStatus = (studentStatuses: string[]) =>
      studentStatuses.every(status => ['EXCHANGE', 'NONDEGREE', 'TRANSFERRED'].includes(status))
    if (studentStatuses && !hasCorrectStatus(studentStatuses)) {
      return res.status(400).json({ error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' })
    }

    const requestedStudyRights: { programme: string; combinedProgramme: string } | null =
      await safeJSONParse(requestedStudyRightsJSON)
    if (requestedStudyRights === null) {
      return res.status(400).json({ error: 'Invalid studyrights value!' })
    }

    const userFullProgrammeRights = getFullStudyProgrammeRights(userProgrammeRights)
    const userProgrammeRightsCodes = userProgrammeRights.map(({ code }) => code)

    const hasFullAccessToStudents = hasFullAccessToStudentData(userRoles)
    const hasAccessToProgramme = userProgrammeRightsCodes.includes(requestedStudyRights.programme)
    const hasAccessToCombinedProgramme = userProgrammeRightsCodes.includes(requestedStudyRights.combinedProgramme)

    if (!hasFullAccessToStudents && !hasAccessToProgramme && !hasAccessToCombinedProgramme) {
      return res.status(403).json({ error: 'Trying to request unauthorized students data' })
    }

    let result
    if (req.query.years) {
      const upperYearBound = new Date().getFullYear() + 1
      const multiYearStudents = Promise.all(
        req.query.years.map(year => {
          const yearAsNumber = +year
          const monthsForCurrentYear = String((upperYearBound - yearAsNumber) * 12)
          return optimizedStatisticsOf({
            ...req.query,
            userId,
            studyRights: requestedStudyRights.programme,
            year,
            months: monthsForCurrentYear,
          })
        })
      )

      const populationStudentsMerger = (multiYearStudents: any) => {
        const samples = { students: [], courses: [] as any[] }
        const uniqueCourseCodes = new Set<string>()

        for (const year of multiYearStudents) {
          samples.students = samples.students.concat(year.students)
          for (const course of year.courses) {
            if (!uniqueCourseCodes.has(course.code)) {
              uniqueCourseCodes.add(course.code)
              samples.courses.push(course)
            }
          }
        }

        return samples
      }

      result = populationStudentsMerger(await multiYearStudents)
    } else {
      result = await optimizedStatisticsOf({
        ...req.query,
        userId,
        studyRights: requestedStudyRights.programme,
        year,
        months,
      })
    }

    // Obfuscate if user has only limited study programme rights and there are any students
    if (
      'students' in result &&
      !hasFullAccessToStudentData(userRoles) &&
      !userFullProgrammeRights.includes(requestedStudyRights.programme) &&
      !userFullProgrammeRights.includes(requestedStudyRights.combinedProgramme)
    ) {
      result.students = result.students.map(student => {
        const { iv, encryptedData: studentNumber } = encrypt(student.studentNumber)
        // correct year for age distribution calculation but the date is always January 1st
        const obfuscatedBirthDate = new Date(Date.UTC(new Date(student.birthdate).getUTCFullYear(), 0))
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
          tags: [],
          birthdate: obfuscatedBirthDate,
          obfuscated: true,
        }
      })
    }

    return res.json(result)
  }
)

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
  const { id: userId, roles, studentsUserCanAccess: allStudentsUserCanAccess, programmeRights } = req.user

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
      userId,
      year: '1900',
      studyRights: undefined,
      semesters: ['FALL', 'SPRING'],
    },
    studentNumbers
  )
  let courseProviders: string[] = []
  if (!hasFullAccessToStudentData(roles)) {
    courseProviders = await getCourseProvidersForCourses(JSON.parse(coursecodes))
  }
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const rightsMappedToProviders = mapToProviders(fullStudyProgrammeRights)
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
    studyRights: SISStudyRightModel[]
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

  if ('students' in result) {
    result.students = result.students.map(student =>
      studentsUserCanAccess.has(student.studentNumber) ? student : obfuscateStudent(student)
    )
  }

  res.json(result)
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
  const { id: userId, roles, studentsUserCanAccess } = req.user
  const filteredStudentNumbers = hasFullAccessToStudentData(roles)
    ? studentnumberlist
    : intersection(studentnumberlist, studentsUserCanAccess)

  const studyProgrammeCode = tags?.studyProgramme?.split('+')[0]

  const result = await optimizedStatisticsOf(
    {
      userId,
      year: tags?.year ?? '1900',
      studyRights: studyProgrammeCode,
      semesters: ['FALL', 'SPRING'],
    },
    filteredStudentNumbers
  )

  const resultWithStudyProgramme = { ...result, studyProgramme: tags?.studyProgramme }
  const discardedStudentNumbers = difference(studentnumberlist, filteredStudentNumbers)

  res.status(200).json({ ...resultWithStudyProgramme, discardedStudentNumbers })
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
