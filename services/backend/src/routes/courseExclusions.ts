import { Router } from 'express'

import { addExcludedCourses, removeExcludedCourses } from '../services/excludedCourses'

const router = Router()

export type ExcludedCoursesParams = { code: string }
export type ExcludedCoursesResBody = void
export type ExcludedCoursesReqBody = {
  courseCodes: string[]
  curriculumVersion: string
}

router.post<ExcludedCoursesParams, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/:code', async (req, res) => {
  const { code: programmeCode } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await addExcludedCourses(courseCodes, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(201).end()
})

router.delete<ExcludedCoursesParams, ExcludedCoursesResBody, ExcludedCoursesReqBody>('/:code', async (req, res) => {
  const { code: programmeCode } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await removeExcludedCourses(courseCodes, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(204).end()
})

export default router
