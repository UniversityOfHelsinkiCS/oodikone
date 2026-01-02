import { Router } from 'express'

import type { ExcludedCoursesResBody, ExcludedCoursesReqBody } from '@oodikone/shared/routes/courseExclusions'
import { hasFullAccessToStudentData } from 'src/util'
import { addExcludedCourses, removeExcludedCourses } from '../services/excludedCourses'

const router = Router()

router.post<never, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/', async (req, res) => {
  const { programmeCode, courseCodes, curriculumVersion } = req.body
  const { roles, programmeRights } = req.user

  const hasFullAccess = hasFullAccessToStudentData(roles)
  const hasAccessToProgramme = programmeRights.map(({ code }) => code).includes(programmeCode)

  if (!hasFullAccess && !hasAccessToProgramme) return res.status(403).end()

  const result = await addExcludedCourses(courseCodes, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(201).end()
})

router.delete<never, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/', async (req, res) => {
  const { programmeCode, courseCodes, curriculumVersion } = req.body
  const { roles, programmeRights } = req.user

  const hasFullAccess = hasFullAccessToStudentData(roles)
  const hasAccessToProgramme = programmeRights.map(({ code }) => code).includes(programmeCode)

  if (!hasFullAccess && !hasAccessToProgramme) return res.status(403).end()

  const result = await removeExcludedCourses(courseCodes, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(204).end()
})

export default router
