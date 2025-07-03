import { Router } from 'express'

import { findStudentsCloseToGraduation, getCloseToGraduationData } from '../services/populations/closeToGraduation'
import { getAllStudentsUserHasInGroups } from '../services/studyGuidanceGroups'
import { hasFullAccessToStudentData } from '../util'

const router = Router()

type CloseToGraduationResBody = Awaited<ReturnType<typeof findStudentsCloseToGraduation>>

router.get<never, CloseToGraduationResBody>('/', async (req, res) => {
  const { user } = req
  if (hasFullAccessToStudentData(user.roles)) {
    const result = await getCloseToGraduationData()
    return res.json(result)
  }
  const studentsInUsersGuidanceGroups = await getAllStudentsUserHasInGroups(user.sisPersonId)
  const result = await getCloseToGraduationData(studentsInUsersGuidanceGroups)
  res.json(result)
})

export default router
