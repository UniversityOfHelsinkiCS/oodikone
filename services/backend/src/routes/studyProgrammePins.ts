import { Response, Router } from 'express'

import { createStudyProgrammePin, getStudyProgrammePins, removeStudyProgrammePin } from '../services/studyProgrammePins'
import { OodikoneRequest } from '../types'

const router = Router()

router.get('/', async (req: OodikoneRequest, res: Response) => {
  const result = await getStudyProgrammePins(req.user!.id)
  return res.json(result)
})

router.post('/', async (req: OodikoneRequest, res: Response) => {
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await createStudyProgrammePin(req.user!.id, programmeCode)
  return res.status(201).end()
})

router.delete('/', async (req: OodikoneRequest, res: Response) => {
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await removeStudyProgrammePin(req.user!.id, programmeCode)
  return res.status(204).end()
})

export default router
