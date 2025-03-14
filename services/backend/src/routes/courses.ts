import crypto from 'crypto'
import { Request, Response, Router } from 'express'

import { getCourseYearlyStats } from '../services/courses'
import { getCoursesByNameAndOrCode, getCoursesByCodes } from '../services/courses/courseFinders'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData, validateParamLength } from '../util'

const router = Router()

interface GetCoursesRequest extends Request {
  query: {
    name: string
    code: string
    combineSubstitutions: string
  }
}

router.get('/v2/coursesmulti', async (req: GetCoursesRequest, res: Response) => {
  const { name, code, combineSubstitutions } = req.query
  if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
    return res.status(400).json({ error: 'Query parameter name or code is invalid' })
  }

  const courses = await getCoursesByNameAndOrCode(name, code)

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

  const mergedCourses = {}

  for (const course of courses) {
    const groupId = combineSubstitutions === 'true' ? course.subsId! : course.code
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
})

interface GetCourseYearlyStatsRequest extends Request {
  query: {
    codes: string[]
    separate: string
    combineSubstitutions: string
  }
}

router.get('/v3/courseyearlystats', async (req: GetCourseYearlyStatsRequest, res: Response) => {
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
    return res.status(422).send('Missing required query parameters')
  }

  const combineSubstitutions = req.query.combineSubstitutions !== 'false'
  const separate = req.query.separate === 'true'

  // Student numbers should be obfuscated to all other users except admins,
  // fullSisuAccess users, and users with rights to any specific study programmes
  const anonymize = !userHasFullAccessToStudentData && fullStudyProgrammeRights.length === 0
  const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null
  const results = await getCourseYearlyStats(codes, separate, anonymizationSalt, combineSubstitutions)
  res.json(results)
})

export default router
