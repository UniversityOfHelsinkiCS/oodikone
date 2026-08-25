import crypto from 'crypto'
import { Router } from 'express'

import { CanError } from '@oodikone/shared/routes'
import {
  CoursesMultiResBody,
  CoursesMultiReqBody,
  CoursesMultiQuery,
  CourseYearlyStatsReqBody,
  CourseYearlyStatsQuery,
  CourseDetails,
  CourseDetailsQuery,
} from '@oodikone/shared/routes/courses'
import { getCourseDetails, getCourseYearlyStats } from '../services/courses'
import { getCoursesByNameAndOrCode } from '../services/courses/courseFinders'
import {
  getFullStudyProgrammeRights,
  handleQueryArrays,
  hasFullAccessToStudentData,
  validateParamLength,
} from '../util'
import { CourseYearlyStats } from '@oodikone/shared/types/courseYearlyStats'

const router = Router()

router.get<never, CanError<CoursesMultiResBody>, CoursesMultiReqBody, CoursesMultiQuery>(
  '/coursesmulti',
  async (req, res) => {
    const { name, code } = req.query
    if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
      return res.status(400).json({ error: 'Query parameter name or code is invalid' })
    }

    const courses = await getCoursesByNameAndOrCode(name, code)
    res.json({ courses }).end()
  }
)

export type CourseYearlyStatsResBody = CourseYearlyStats[]

router.get<never, CanError<CourseYearlyStatsResBody>, CourseYearlyStatsReqBody, CourseYearlyStatsQuery>(
  '/courseyearlystats',
  async (req, res) => {
    const { courses, substitutions, separate, fromYearCode, toYearCode } = req.query

    if (!courses?.length) {
      return res.status(422).send({ error: 'Missing required query parameters' })
    }

    const { roles, programmeRights } = req.user
    const userHasFullAccessToStudentData = hasFullAccessToStudentData(roles)
    const userHasAccessToCourseStats = userHasFullAccessToStudentData || roles.includes('courseStatistics')
    const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

    // If user has rights to see at least one programme, then they are allowed to see all of them
    if (!userHasAccessToCourseStats && !fullStudyProgrammeRights.length) {
      return res.status(403).json({ error: 'No valid rights provided' })
    }

    // Student numbers should be obfuscated to all other users except admins,
    // fullSisuAccess users, and users with rights to any specific degree programmes
    const anonymize = !userHasFullAccessToStudentData && fullStudyProgrammeRights.length === 0
    const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null

    const useSeparate = separate === 'true'

    const results = await getCourseYearlyStats(
      handleQueryArrays(courses),
      useSeparate,
      anonymizationSalt,
      substitutions === 'true',
      fromYearCode,
      toYearCode
    )
    return res.json(results)
  }
)

router.get<never, CanError<CourseDetails>, never, CourseDetailsQuery>('/coursedetails', async (req, res) => {
  const { courses } = req.query
  const courseIds = handleQueryArrays(courses)

  if (!courseIds.length) return res.status(422).send({ error: 'Missing required parameters' })
  const details = await getCourseDetails(courseIds)

  return res.json(details)
})

export default router
