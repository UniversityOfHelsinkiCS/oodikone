import { Request, Response, Router } from 'express'

import { addExcludedCourses, removeExcludedCourses } from '../services/excludedCourses'

const router = Router()

interface ExcludedCoursesRequest extends Request {
  body: {
    courseCodes: string[]
    curriculumVersion: string
  }
  params: {
    code: string
  }
}

router.post('/:code', async (req: ExcludedCoursesRequest, res: Response) => {
  const { code: programmeCode } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await addExcludedCourses(courseCodes, curriculumVersion, programmeCode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.status(201).end()
})

router.delete('/:code', async (req: ExcludedCoursesRequest, res: Response) => {
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
