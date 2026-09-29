import { Router } from 'express'

import type { ExcludedCoursesResBody, ExcludedCoursesReqBody } from '@oodikone/shared/routes/courseExclusions'
import { addExcludedCourses, removeExcludedCourses } from '../services/excludedCourses'
import { hasFullAccessToStudentData } from '../util'

const router = Router()

router.post<never, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/', async (req, res) => {
  const { programmeCode, courseGroupIds, curriculumVersion } = req.body
  const { roles, programmeRights } = req.user

  const hasFullAccess = hasFullAccessToStudentData(roles)
  const hasAccessToProgramme = programmeRights.map(({ code }) => code).includes(programmeCode)

  if (!hasFullAccess && !hasAccessToProgramme) return res.status(403).end()

  const result = await addExcludedCourses(courseGroupIds, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(201).end()
})

router.delete<never, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/', async (req, res) => {
  const { programmeCode, courseGroupIds, curriculumVersion } = req.body
  const { roles, programmeRights } = req.user

  const hasFullAccess = hasFullAccessToStudentData(roles)
  const hasAccessToProgramme = programmeRights.map(({ code }) => code).includes(programmeCode)

  if (!hasFullAccess && !hasAccessToProgramme) return res.status(403).end()

  const result = await removeExcludedCourses(courseGroupIds, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(204).end()
})

export default router
