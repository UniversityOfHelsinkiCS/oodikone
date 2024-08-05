import { Request, Response, Router } from 'express'

import { createStudyProgrammePin, getStudyProgrammePins, removeStudyProgrammePin } from '../services/studyProgrammePins'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const result = await getStudyProgrammePins(req.user.id)
  return res.json(result)
})

router.post('/', async (req: Request, res: Response) => {
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await createStudyProgrammePin(req.user.id, programmeCode)
  return res.status(201).end()
})

router.delete('/', async (req: Request, res: Response) => {
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await removeStudyProgrammePin(req.user.id, programmeCode)
  return res.status(204).end()
})

export default router
