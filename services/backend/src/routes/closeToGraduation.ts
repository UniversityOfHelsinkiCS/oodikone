import { Router } from 'express'

import type { CloseToGraduationResBody } from '@oodikone/shared/routes/closeToGraduation'
import { getCloseToGraduationData } from '../services/populations/closeToGraduation'
import { getAllStudentsUserHasInGroups } from '../services/studyGuidanceGroups'
import { hasFullAccessToStudentData } from '../util'

const router = Router()

router.get<never, CloseToGraduationResBody>('/', async (req, res) => {
  const { user } = req

  if (!hasFullAccessToStudentData(user.roles)) {
    const studentNumbers = await getAllStudentsUserHasInGroups(user.sisPersonId)
    const result = await getCloseToGraduationData(studentNumbers)

    res.json(result)
  }

  const result = await getCloseToGraduationData()
  return res.json(result)
})

export default router
