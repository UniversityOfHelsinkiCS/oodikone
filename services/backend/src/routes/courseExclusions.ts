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
  const result = await addExcludedCourses(programmeCode, courseCodes, curriculumVersion)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.delete('/:code', async (req: ExcludedCoursesRequest, res: Response) => {
  const { code: programmeCode } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await removeExcludedCourses(programmeCode, courseCodes, curriculumVersion)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

export default router
