import { Response, Router } from 'express'

import { changeGroupTags, getAllGroupsAndStudents } from '../services/studyGuidanceGroups'
import { OodikoneRequest } from '../types'
import logger from '../util/logger'

const router = Router()

router.get('/', async (req: OodikoneRequest, res: Response) => {
  const { username, sisPersonId } = req.user!
  if (!sisPersonId) {
    logger.error(`User ${username} tried to access study guidance groups but personId was ${sisPersonId} in request`)
    return res.status(400).json({ error: 'Not possible to get groups without personId' })
  }
  return res.json(await getAllGroupsAndStudents(sisPersonId))
})

interface ChangeGroupTagsRequest extends OodikoneRequest {
  body: { studyProgramme?: string | null; year?: string | null }
  params: { id: string }
}

router.put('/:id/tags', async (req: ChangeGroupTagsRequest, res: Response) => {
  const {
    user,
    body: tags,
    params: { id: groupId },
  } = req
  const { username, sisPersonId } = user!
  if (!sisPersonId) {
    logger.error(
      `User ${username} tried to change study guidance group tags but personId was ${sisPersonId} in request`
    )
    return res.status(400).json({ error: 'Not possible to change groups without personId' })
  }

  const groupsUserHasAccessTo = (await getAllGroupsAndStudents(sisPersonId)).map(group => group.id)

  if (!groupsUserHasAccessTo.includes(groupId)) {
    logger.error(
      `User ${username} tried to change study guidance group tags, but didn't have permission for the group ${groupId}`
    )
    return res.status(400).json({ error: 'Access denied' })
  }
  return res.status(200).json(await changeGroupTags(groupId, tags))
})

export default router
