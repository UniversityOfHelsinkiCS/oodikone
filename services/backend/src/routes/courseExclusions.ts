import { Router } from 'express'

import { addExcludedCourses, removeExcludedCourses } from '../services/excludedCourses'

const router = Router()

router.post('/:code', async (req, res) => {
  const { code: programmeCode } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await addExcludedCourses(programmeCode, courseCodes, curriculumVersion.join(','))
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.delete('/:code', async (req, res) => {
  const { code: programmeCode } = req.params
  const { curriculumVersion, courseCodes } = req.body
  const result = await removeExcludedCourses(programmeCode, courseCodes, curriculumVersion)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

export default router
