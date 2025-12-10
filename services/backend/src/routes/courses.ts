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
import type { CourseWithSubsId } from '@oodikone/shared/types/course'
import { uniq } from '@oodikone/shared/util'
import { getCourseYearlyStats } from '../services/courses'
import { getCoursesByNameAndOrCode, getCoursesByCodes } from '../services/courses/courseFinders'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData, validateParamLength } from '../util'

const router = Router()

router.get<never, CanError<CoursesMultiResBody>, CoursesMultiReqBody, CoursesMultiQuery>(
  '/v2/coursesmulti',
  async (req, res) => {
    const { name, code, combineSubstitutions } = req.query
    if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
      return res.status(400).json({ error: 'Query parameter name or code is invalid' })
    }

    const courses = await getCoursesByNameAndOrCode(name, code)

    if (combineSubstitutions === 'false') {
      const courseCodes = courses.map(course => course.code)
      const substitutions = uniq(
        courses.flatMap(course => course.substitutions).filter(code => !courseCodes.includes(code))
      )
      const substitutionDetails = await getCoursesByCodes(substitutions)
      for (const substitution of substitutionDetails) {
        courses.push(substitution.toJSON())
      }
    }

    const mergedCourses: Record<string, CourseWithSubsId> = {}

    for (const course of courses) {
      if (!(course.max_attainment_date && course.min_attainment_date)) continue

      const groupId = combineSubstitutions === 'true' ? course.subsId?.toString() : course.code
      if (!groupId) continue

      if (!mergedCourses[groupId]) {
        mergedCourses[groupId] = {
          ...course,
          substitutions: combineSubstitutions === 'true' ? course.substitutions : [],
        }
      } else {
        const mergedCourse = mergedCourses[groupId]
        if (mergedCourse.max_attainment_date < course.max_attainment_date) {
          mergedCourse.max_attainment_date = course.max_attainment_date
        }
        if (mergedCourse.min_attainment_date > course.min_attainment_date) {
          mergedCourse.min_attainment_date = course.min_attainment_date
        }
      }
    }

    res.json({ courses: Object.values(mergedCourses) })
  }
)

type CourseYearlyStatsResBody = Awaited<ReturnType<typeof getCourseYearlyStats>>

router.get<never, CanError<CourseYearlyStatsResBody>, CourseYearlyStatsReqBody, CourseYearlyStatsQuery>(
  '/v3/courseyearlystats',
  async (req, res) => {
    const { codes, combineSubstitutions, separate } = req.query

    if (!codes) {
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

    const results = await getCourseYearlyStats(codes, useSeparate, anonymizationSalt, useCombineSubstitutions)
    res.json(results)
  }
)

export default router
