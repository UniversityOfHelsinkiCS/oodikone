import crypto from 'crypto'
import { Router } from 'express'

import { CanError } from '@oodikone/shared/routes'
import {
  CoursesMultiResBody,
  CoursesMultiReqBody,
  CoursesMultiQuery,
  CourseYearlyStatsReqBody,
  CourseYearlyStatsQuery,
} from '@oodikone/shared/routes/courses'
import type { CourseWithSubsDetails } from '@oodikone/shared/types/course'
import { getCourseDetails, getCourseYearlyStats } from '../services/courses'
import { getCoursesByNameAndOrCode } from '../services/courses/courseFinders'
import {
  getFullStudyProgrammeRights,
  handleQueryArrays,
  hasFullAccessToStudentData,
  validateParamLength,
} from '../util'

const router = Router()

router.get<never, CanError<CoursesMultiResBody>, CoursesMultiReqBody, CoursesMultiQuery>(
  '/coursesmulti',
  async (req, res) => {
    const { name, code, includeSpecial } = req.query
    if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
      return res.status(400).json({ error: 'Query parameter name or code is invalid' })
    }

    const courses = await getCoursesByNameAndOrCode(name, code, includeSpecial === 'true')

    const mergedCourses = new Map<string, CourseWithSubsDetails>()

    for (const course of courses) {
      if (!(course.max_attainment_date && course.min_attainment_date)) continue

      if (!mergedCourses.has(course.code)) mergedCourses.set(course.code, structuredClone(course))
      const mergedCourse = mergedCourses.get(course.code)!

      if (mergedCourse.max_attainment_date < course.max_attainment_date) {
        mergedCourse.max_attainment_date = course.max_attainment_date
      }
      if (mergedCourse.min_attainment_date > course.min_attainment_date) {
        mergedCourse.min_attainment_date = course.min_attainment_date
      }
    }

    res.json({ courses: Array.from(mergedCourses.values()) })
  }
)

type CourseYearlyStatsResBody = Awaited<ReturnType<typeof getCourseYearlyStats>>

router.get<never, CanError<CourseYearlyStatsResBody>, CourseYearlyStatsReqBody, CourseYearlyStatsQuery>(
  '/courseyearlystats',
  async (req, res) => {
    const { codes, combineSubstitutions, separate } = req.query

    const courseCodes = handleQueryArrays(codes)

    if (!courseCodes?.length) {
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

    const useCombineSubstitutions = combineSubstitutions !== 'false'
    const useSeparate = separate === 'true'

    const results = await getCourseYearlyStats(courseCodes, useSeparate, anonymizationSalt, useCombineSubstitutions)
    res.json(results)
  }
)

router.get<never, CanError<unknown>, never, { codes: string | string[] }>('/coursedetails', async (req, res) => {
  const { codes: coursecodes } = req.query
  const codes = handleQueryArrays(coursecodes)

  if (!codes?.length) return res.status(500).end()
  const details = await getCourseDetails(codes)

  return res.json(details)
})

export default router
