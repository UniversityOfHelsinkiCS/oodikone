import crypto from 'crypto'
import { Router } from 'express'
import { difference, intersection, uniq } from 'lodash'

import type { CanError } from '@oodikone/shared/routes'
import {
  type PopulationstatisticsQuery,
  type PopulationstatisticsReqBody,
  type PopulationstatisticsResBody,
  type PopulationstatisticsbycourseResBody,
  type PopulationstatisticsbycourseReqBody,
  type PopulationstatisticsbycourseParams,
  type PostByStudentNumbersResBody,
  type PostByStudentNumbersReqBody,
  type PopulationstatisticsStudyprogrammesResBody,
  PopulationstatisticsMaxYearsToCreatePopulationFormQuery,
  PopulationstatisticsMaxYearsToCreatePopulationFormResBody,
} from '@oodikone/shared/routes/populations'
import { GenderCode, Unification, Unarray } from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { rootOrgId } from '../config'
import { SISStudyRightModel } from '../models'
import { maxYearsToCreatePopulationFrom, getCourseProvidersForCourses } from '../services/courses'
import { encrypt } from '../services/encrypt'
import { getDegreeProgrammesOfOrganization, ProgrammesOfOrganization } from '../services/faculty/faculty'
import { getStudentTags } from '../services/populations/getStudentData'
import { parseDateRangeFromParams } from '../services/populations/shared'
import { statisticsOf } from '../services/populations/statisticsOf'
import { getStudentNumbersWithStudyRights } from '../services/populations/studentNumbersWithStudyRights'
import { findByCourseAndSemesters } from '../services/students'
import { ParsedCourse } from '../types'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'

const router = Router()

router.get<never, CanError<PopulationstatisticsResBody>, PopulationstatisticsReqBody, PopulationstatisticsQuery>(
  '/v3/populationstatistics',
  async (req, res) => {
    const { id: userId, roles: userRoles, programmeRights: userProgrammeRights } = req.user
    const { years, semesters, programme, combinedProgramme, studentStatuses } = req.query

    const requiredFields = [years, semesters, programme]
    if (requiredFields.some(field => !field)) {
      return res.status(400).json({ error: 'The query should have years, semesters and a programme defined' })
    }

    if (!semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
      return res.status(400).json({ error: 'Semester should be either SPRING OR FALL' })
    }

    const hasCorrectStatus = (studentStatuses: string[]) =>
      studentStatuses.every(status => ['EXCHANGE', 'NONDEGREE', 'TRANSFERRED'].includes(status))
    if (studentStatuses && !hasCorrectStatus(studentStatuses)) {
      return res.status(400).json({ error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' })
    }

    const hasFullAccessToStudents = hasFullAccessToStudentData(userRoles)

    const userFullProgrammeRights = getFullStudyProgrammeRights(userProgrammeRights)
    const hasFullRightsToProgramme = userFullProgrammeRights.includes(programme)
    const hasFullRightsToCombinedProgramme = userFullProgrammeRights.includes(combinedProgramme!)

    const userProgrammeRightsCodes = userProgrammeRights.map(({ code }) => code)
    const hasAccessToProgramme = userProgrammeRightsCodes.includes(programme)
    const hasAccessToCombinedProgramme = userProgrammeRightsCodes.includes(combinedProgramme!)

    if (!hasFullAccessToStudents && !hasAccessToProgramme && !hasAccessToCombinedProgramme) {
      return res.status(403).json({ error: 'Trying to request unauthorized students data' })
    }

    const { startDate, endDate } = parseDateRangeFromParams({
      ...req.query,
      years: req.query.years,
    })

    const studentNumbers = await getStudentNumbersWithStudyRights({
      programmeCodes: [programme],
      startDate,
      endDate,
      studentStatuses,
    })

    const studyRights = [programme]
    const tagList = await getStudentTags(studyRights, studentNumbers, userId)

    const result = await statisticsOf(studentNumbers, studyRights, tagList, startDate)

    // Obfuscate if user has only limited degree programme rights and there are any students
    if (!hasFullAccessToStudents && !hasFullRightsToProgramme && !hasFullRightsToCombinedProgramme) {
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

router.get<
  never,
  CanError<PopulationstatisticsbycourseResBody>,
  PopulationstatisticsbycourseReqBody,
  PopulationstatisticsbycourseParams
>('/v3/populationstatisticsbycourse', async (req, res) => {
  const { id: userId, roles, studentsUserCanAccess: allStudentsUserCanAccess, programmeRights } = req.user
  const { coursecodes: coursecodeJSON, from, to, separate, unifyCourses } = req.query

  if (!coursecodeJSON || !from || !to) {
    return res.status(400).json({ error: 'The body should have a yearcode and coursecode defined' })
  }

  const isSeparate = separate === 'true'
  const coursecodes = JSON.parse(coursecodeJSON)

  const toFromDiff = Math.abs(Number(to) - Number(from) + 1)
  const requestedYearsToCreatePopulationFrom = Math.ceil(isSeparate ? toFromDiff / 2 : toFromDiff) // 2 semesters = 1 year

  const maxYearsForPopulation = await maxYearsToCreatePopulationFrom(coursecodes, Unification.REGULAR)
  if (requestedYearsToCreatePopulationFrom > maxYearsForPopulation) {
    return res.status(400).json({ error: `Max years to create population from is ${maxYearsForPopulation}` })
  }

  const studentNumbers = await findByCourseAndSemesters(coursecodes, Number(from), Number(to), isSeparate, unifyCourses)

  const studyRights = []
  const tagList = await getStudentTags(studyRights, studentNumbers, userId)
  const result: any = await statisticsOf(studentNumbers, studyRights, tagList)
  const courseProviders: string[] = !hasFullAccessToStudentData(roles)
    ? await getCourseProvidersForCourses(coursecodes)
    : []
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

router.post<never, PostByStudentNumbersResBody, PostByStudentNumbersReqBody>(
  '/v3/populationstatisticsbystudentnumbers',
  async (req, res) => {
    const { studentnumberlist, tags } = req.body
    const { id: userId, roles, studentsUserCanAccess } = req.user
    const filteredStudentNumbers = hasFullAccessToStudentData(roles)
      ? studentnumberlist
      : intersection(studentnumberlist, studentsUserCanAccess)

    const studyProgrammeCode = tags?.studyProgramme?.split('+')[0]

    const studyRights = [studyProgrammeCode].filter(value => value !== undefined)
    const tagList = await getStudentTags(studyRights, filteredStudentNumbers, userId)

    const { startDate } = tags?.year
      ? parseDateRangeFromParams({ semesters: ['FALL', 'SPRING'], years: [tags?.year] })
      : { startDate: undefined }

    const result = await statisticsOf(filteredStudentNumbers, studyRights, tagList, startDate)

    const resultWithStudyProgramme = { ...result, studyProgramme: tags?.studyProgramme }
    const discardedStudentNumbers = difference(studentnumberlist, filteredStudentNumbers)

    res.status(200).json({ ...resultWithStudyProgramme, discardedStudentNumbers })
  }
)

router.get<never, PopulationstatisticsStudyprogrammesResBody>(
  '/v3/populationstatistics/studyprogrammes',
  async (req, res) => {
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
  }
)

router.get<
  never,
  PopulationstatisticsMaxYearsToCreatePopulationFormResBody,
  never,
  PopulationstatisticsMaxYearsToCreatePopulationFormQuery
>('/v3/populationstatistics/maxYearsToCreatePopulationFrom', async (req, res) => {
  const courseCodes = JSON.parse(req.query.courseCodes) as string[]
  const maxYearsToCreatePopulationFromOpen = await maxYearsToCreatePopulationFrom(courseCodes, Unification.OPEN)
  const maxYearsToCreatePopulationFromUni = await maxYearsToCreatePopulationFrom(courseCodes, Unification.REGULAR)
  const maxYearsToCreatePopulationFromBoth = await maxYearsToCreatePopulationFrom(courseCodes, Unification.UNIFY)
  return res.json({
    openCourses: maxYearsToCreatePopulationFromOpen,
    uniCourses: maxYearsToCreatePopulationFromUni,
    unifyCourses: maxYearsToCreatePopulationFromBoth,
  })
})

export default router
