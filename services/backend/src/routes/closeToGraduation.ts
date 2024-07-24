import { Response, Router } from 'express'

import { getCloseToGraduationData } from '../services/populations/closeToGraduation'
import { getAllStudentsUserHasInGroups } from '../services/studyGuidanceGroups'
import { OodikoneRequest } from '../types'
import { hasFullAccessToStudentData } from '../util'

const router = Router()

router.get('/', async (req: OodikoneRequest, res: Response) => {
  const { user } = req
  if (hasFullAccessToStudentData(user!.roles)) {
    const result = await getCloseToGraduationData()
    return res.json(result)
  }
  const studentsInUsersGuidanceGroups = await getAllStudentsUserHasInGroups(user!.sisPersonId)
  const result = await getCloseToGraduationData(studentsInUsersGuidanceGroups)
  res.json(result)
})

export default router
