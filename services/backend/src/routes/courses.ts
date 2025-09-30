import crypto from 'crypto'
import { Router } from 'express'

import { CanError } from '@oodikone/shared/routes'
import { getCourseYearlyStats } from '../services/courses'
import { getCoursesByNameAndOrCode, getCoursesByCodes } from '../services/courses/courseFinders'
import { CourseWithSubsId } from '../types/course'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData, validateParamLength } from '../util'

const router = Router()

type CoursesMultiReqBody = never
type CoursesMultiResBody = { courses: CourseWithSubsId[] }
type CoursesMultiQuery = {
  name: string
  code: string
  combineSubstitutions: string
}

router.get<never, CanError<CoursesMultiResBody>, CoursesMultiReqBody, CoursesMultiQuery>(
  '/v2/coursesmulti',
  async (req, res) => {
    const { name, code, combineSubstitutions } = req.query
    if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
      return res.status(400).json({ error: 'Query parameter name or code is invalid' })
    }

    const courses: CourseWithSubsId[] = await getCoursesByNameAndOrCode(name, code)

    if (combineSubstitutions === 'false') {
      const courseCodes = courses.map(course => course.code)
      const substitutions = [
        ...new Set(
          courses.flatMap(course => course.substitutions).filter(code => code !== null && !courseCodes.includes(code))
        ),
      ]
      const substitutionDetails = await getCoursesByCodes(substitutions)
      for (const substitution of substitutionDetails) {
        courses.push(substitution.toJSON())
      }
    }

    const mergedCourses: Record<string, CourseWithSubsId> = {}

    for (const course of courses) {
      const groupId = combineSubstitutions === 'true' ? (course.subsId?.toString() ?? '') : course.code
      if (!(course.max_attainment_date && course.min_attainment_date)) {
        continue
      }
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
type CourseYearlyStatsReqBody = never
type CourseYearlyStatsQuery = {
  codes: string[]
  separate: string
  combineSubstitutions: string
}

router.get<never, CanError<CourseYearlyStatsResBody>, CourseYearlyStatsReqBody, CourseYearlyStatsQuery>(
  '/v3/courseyearlystats',
  async (req, res) => {
    const { roles, programmeRights } = req.user

    const userHasFullAccessToStudentData = hasFullAccessToStudentData(roles)
    const userHasCorrectRole = userHasFullAccessToStudentData === true || roles.includes('courseStatistics')
    const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

    // If user has rights to see at least one programme, then they are allowed to see all of them
    if (!userHasCorrectRole && fullStudyProgrammeRights.length === 0) {
      return res.status(403).json({ error: 'No programmes so no access to course stats' })
    }

    const { codes } = req.query
    if (!codes) {
      return res.status(422).send({ error: 'Missing required query parameters' })
    }

    const combineSubstitutions = req.query.combineSubstitutions !== 'false'
    const separate = req.query.separate === 'true'

    // Student numbers should be obfuscated to all other users except admins,
    // fullSisuAccess users, and users with rights to any specific degree programmes
    const anonymize = !userHasFullAccessToStudentData && fullStudyProgrammeRights.length === 0
    const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null
    const results = await getCourseYearlyStats(codes, separate, anonymizationSalt, combineSubstitutions)
    res.json(results)
  }
)

export default router
