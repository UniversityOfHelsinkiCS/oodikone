import { Express } from 'express'
import request from 'supertest'
import { assert } from 'vitest'

import { Unarray } from '@oodikone/shared/types'
import { Grades } from '@oodikone/shared/types/courseYearlyStats'
import { CourseYearlyStatsResBody } from '@/routes/courses'
import { ResponseWithBody } from '../../../utils'

export type CourseYearlyStats = Unarray<CourseYearlyStatsResBody>

/** GET /courseyearlystats as a basic user and return the course's stats. */
export const getCourseYearlyStats = async (app: Express, query: string): Promise<CourseYearlyStats> => {
  const res = (await request(app)
    .get(`/courseyearlystats?${query}`)
    .set('shib-session-id', 'test')
    .set('uid', 'basic')
    .set('hygroupcn', 'grp-oodikone-basic-users')) as ResponseWithBody<CourseYearlyStatsResBody>

  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.length, 1, 'Query to return anything')
  const body = res.body.at(0)!
  assert(
    'unifyStats' in body && 'regularStats' in body && 'openStats' in body,
    'All keys of courseyearlystats not defined'
  )
  return body
}

/** Calculates passed and failed from students.grades instead of attempts.categories
 * because students includes only deduplicated credits and attempts include all credits
 * student has done
 */
export const calculatePassedAndFailed = (studentGrades: Grades) => {
  const studentCategories: { passed: string[]; failed: string[] } = { passed: [], failed: [] }
  Object.entries(studentGrades).forEach(([grade, studentNumbers]) => {
    studentCategories[grade === '0' ? 'failed' : 'passed'].push(...studentNumbers)
  })
  return studentCategories
}
